## Addrset

Addrset 是一个基于手工收录列表和网络数据生成 IP 和网站地址合集的项目。

IP 数据来自 RIR（Regional Internet Registry）。网站合集在 `./data/site` 中以 YAML 格式保存。输出的 CIDR 列表都经过合并优化。

网站列表以标签整理，在输出的数据中相同标签的地址被合并为一处。IP 地址以 ISO 两字符地址代码作为标签，保留 IP 地址以 `reserve` 作为标签。

Addrset is a project that generates collections of IP addresses and websites based on manually collected lists and network data.

IP data comes from RIR (Regional Internet Registry). The website collection is saved in YAML format in `./data/site`. The output CIDR lists are merged and optimized.

The website list is organized by tags, and in the output data, addresses with the same tag are merged into one place. IP addresses use ISO two-character country codes as tags, and reserved IP addresses use `reserve` as the tag.

在网站列表中 In the website list

```yaml
- "cloudflare.com"       # 表示完全匹配域名                   exact this match
- ".cloudflare.net"      # 表示匹配此域名及以此为后缀的域名   this domain and domains with this as suffix
- "*.cloudflare-dns.com" # 表示此为后缀的域名                 domains with this as suffix
```

### 输出文件 Output Files

```yaml
- ./dist/ip/v4/*.txt          # IPv4 CIDR 文件，按标签命名，如 cn.txt IPv4    CIDR files, named by tag, e.g., cn.txt
- ./dist/ip/v6/*.txt          # IPv6 CIDR 文件，按标签命名，如 us.txt IPv6    CIDR files, named by tag, e.g., us.txt
- ./dist/ip/json/block.json   # 所有 IP 块的 JSON 数据                        JSON data for all IP blocks
- ./dist/ip/json/tag.json     # 按标签分组的 IP 块 JSON 数据                  JSON data for IP blocks grouped by tag
- ./dist/site/json/*.json     # 网站数据 JSON 文件，按标签命名，如 category-bttracker.json Website data    JSON files, named by tag, e.g., category-bttracker.json
- ./dist/clash/*.yaml         # Clash 规则文件，按标签命名，如 category-bttracker.yaml ip-cn.yaml          Clash rule files, named by tag, e.g., category-bttracker.yaml ip-cn.yaml
```
### 在 Clash 导入 Load into Clash

```yaml
rule-providers:
  category-ai:
  type: http
  behavior: classical
  url: https://<addrset-host-server>/clash/category-ai.yaml
  interval: 3600
  proxy: PROXY
rules:
  - RULE-SET,category-ai,PROXY
```

Doc: https://wiki.metacubex.one/config/rule-providers/
