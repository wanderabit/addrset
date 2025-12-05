//go:build tool

package main

import (
	"fmt"
	"net/netip"

	"github.com/oschwald/maxminddb-golang/v2"
)

func main() {
	db, err := maxminddb.Open("./dist/ip/mmdb/country.mmdb")
	if err != nil {
		fmt.Println("open maxminddb error:", err)
		return
	}

	defer db.Close()

	{
		ip, err := netip.ParseAddr("1.1.1.1")
		if err != nil {
			fmt.Println("parse ip address error:", err)
			return
		}

		var res map[string]any

		if err := db.Lookup(ip).Decode(&res); err != nil {
			fmt.Println("lookup ip address error:", err)
			return
		}

		fmt.Printf("maxminddb lookup result: %+v\n", res)
	}

	{
		ip, err := netip.ParseAddr("2408:8207:1911:ada0:be24:11ff:feec:76a1")
		if err != nil {
			fmt.Println("parse ip address error:", err)
			return
		}

		var res map[string]any

		if err := db.Lookup(ip).Decode(&res); err != nil {
			fmt.Println("lookup ip address error:", err)
			return
		}

		fmt.Printf("maxminddb lookup result: %+v\n", res)
	}
}
