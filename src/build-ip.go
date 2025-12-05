package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"

	"github.com/maxmind/mmdbwriter"
	"github.com/maxmind/mmdbwriter/mmdbtype"
)

func isFileExist(path string) bool {
	_, err := os.Stat(path)
	return err == nil || os.IsExist(err)
}

type TagData struct {
	IPv4 []string `json:"ipv4"`
	IPv6 []string `json:"ipv6"`
}

func main() {
	data, err := os.ReadFile("./dist/ip/json/tag.json")
	if err != nil {
		fmt.Printf("read file error: %v\n", err)
		os.Exit(1)
	}

	var tag map[string]TagData
	if err := json.Unmarshal(data, &tag); err != nil {
		fmt.Printf("unmarshal error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("found %d tags\n", len(tag))

	// reference https://github.com/MetaCubeX/mihomo/blob/Meta/component/mmdb/reader.go
	writer, err := mmdbwriter.New(mmdbwriter.Options{
		DatabaseType:            "addrset-country",
		IncludeReservedNetworks: true,
	})
	if err != nil {
		fmt.Println("mmdb writer error:", err)
		os.Exit(1)
	}

	var insert = func(i string, tag string) {
		_, cidr, err := net.ParseCIDR(i)
		if err != nil {
			fmt.Printf("parse cidr %+v error: %v\n", i, err)
		}

		content := mmdbtype.Map{
			"network": mmdbtype.String(i),
			"tag":     mmdbtype.String(tag),
			"country": mmdbtype.Map{
				"iso_code": mmdbtype.String(strings.ToUpper(tag)),
			},
		}

		if err := writer.Insert(cidr, content); err != nil {
			fmt.Printf("insert cidr %+v error: %v\n", i, err)
		}
	}

	counter := 0
	for t, v := range tag {
		for _, i := range v.IPv4 {
			insert(i, t)
		}
		for _, i := range v.IPv6 {
			insert(i, t)
		}
		counter += len(v.IPv4) + len(v.IPv6)
	}

	fmt.Printf("inserted %d networks\n", counter)

	if err := os.MkdirAll("./dist/ip/mmdb", os.ModePerm); err != nil {
		fmt.Println("create directory error:", err)
		os.Exit(1)
	}

	const target = "./dist/ip/mmdb/country.mmdb"

	if isFileExist(target) {
		fmt.Println("remove", target)
		os.Remove(target)
	}

	fd, err := os.Create(target)
	if err != nil {
		fmt.Println("create mmdb file error:", err)
		os.Exit(1)
	}

	defer fd.Close()

	fmt.Println("write mmdb file", target)
	if _, err := writer.WriteTo(fd); err != nil {
		fmt.Println("write mmdb file error:", err)
		os.Exit(1)
	}
}
