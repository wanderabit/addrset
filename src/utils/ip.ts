export interface Block {
    tag: string;
    type: "IPv4" | "IPv6";
    cidr: string;
}

export function isIPv4(s: string): boolean {
    const parts = s.split(".");
    if (parts.length !== 4) return false;
    for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) return false;
    }

    return true;
}

export function isIPv6(s: string): boolean {
    const parts = s.split(":");
    if (parts.length < 3 || parts.length > 8) return false;
    for (const part of parts) {
        if (part.length === 0) continue;
        const num = parseInt(part, 16);
        if (isNaN(num) || num < 0 || num > 0xffff) return false;
    }

    return true;
}

export function isCIDR(s: string): boolean {
    const parts = s.split("/");
    if (parts.length !== 2) return false;
    const [ip, prefix] = parts;
    if (!ip || !prefix) return false;
    const prefixNum = parseInt(prefix, 10);
    if (isIPv4(ip)) {
        return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
    } else if (isIPv6(ip)) {
        return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 128;
    } else {
        return false;
    }
}

export function parseRirData(txt: string): Block[] {
    const lst: Block[] = [];
    const lines = txt
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter((line) => line && !line.startsWith("#"));

    for (const line of lines) {
        const parts = line.split("|");
        if (parts.length < 7) continue;

        const [_registry, cc, type, start, value, _date, status] = parts;

        if (!cc || !cc.match(/^[A-Z]{2}$/)) continue;
        if (!value) continue;
        if (status !== "allocated" && status !== "assigned") continue;

        if (type === "ipv4") {
            if (!start || !isIPv4(start)) continue;
            const val = parseInt(value, 10);
            if (isNaN(val) || val <= 0 || val > Math.pow(2, 32)) continue;
            for (const cidr of convertIPv4Cidr(start, val)) {
                if (!isCIDR(cidr)) continue;
                lst.push({ tag: cc.toLowerCase(), type: "IPv4", cidr: cidr });
            }
        } else if (type === "ipv6") {
            if (!start || !isIPv6(start)) continue;
            const val = parseInt(value, 10);
            if (!val || val <= 0 || val > 128) continue;
            const cidr = `${start}/${val}`;
            if (!isCIDR(cidr)) continue;
            lst.push({ tag: cc.toLowerCase(), type: "IPv6", cidr: cidr });
        }
    }

    return lst;
}

export function convertIPv4Cidr(ip: string, value: number): string[] {
    if (!isIPv4(ip)) return [];
    if (isNaN(value) || value <= 0 || value > Math.pow(2, 32)) return [];

    const [a, b, c, d] = ip.split(".").map((x) => parseInt(x, 10));
    const cidr = 32 - Math.log2(value);
    if (Number.isInteger(cidr)) return [`${a}.${b}.${c}.${d}/${cidr}`];

    const result: string[] = [];
    let rest = value,
        currA = a!,
        currB = b!,
        currC = c!,
        currD = d!;

    while (rest > 0) {
        let maxBlock = 1;
        while (maxBlock * 2 <= rest) maxBlock *= 2;
        const blockCidr = 32 - Math.log2(maxBlock);
        result.push(`${currA}.${currB}.${currC}.${currD}/${blockCidr}`);
        rest -= maxBlock;
        currD += maxBlock;
        if (currD > 255) {
            currD = 0;
            currC += 1;
            if (currC > 255) {
                currC = 0;
                currB += 1;
                if (currB > 255) {
                    currB = 0;
                    currA += 1;
                }
            }
        }
    }

    return result;
}

export const RIR = {
    "arin": "https://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest",
    "ripencc": "https://ftp.ripe.net/ripe/stats/delegated-ripencc-extended-latest",
    "apnic": "https://ftp.apnic.net/stats/apnic/delegated-apnic-extended-latest",
    "lacnic": "https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-extended-latest",
    "afrinic": "https://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-extended-latest",
};

export const StaticBlock: Block[] = [
    // RFC 1122 This host on this network
    { tag: "reserve", type: "IPv4", cidr: "0.0.0.0/8" },

    // RFC 1918 Private Address Space
    { tag: "reserve", type: "IPv4", cidr: "10.0.0.0/8" },
    { tag: "reserve", type: "IPv4", cidr: "172.16.0.0/12" },
    { tag: "reserve", type: "IPv4", cidr: "192.168.0.0/16" },

    // RFC 5735/RFC 1122 Loopback
    { tag: "reserve", type: "IPv4", cidr: "127.0.0.0/8" },

    // RFC 6598 Shared Address Space (Carrier-Grade NAT)
    { tag: "reserve", type: "IPv4", cidr: "100.64.0.0/10" },

    // RFC 3927 Link-Local
    { tag: "reserve", type: "IPv4", cidr: "169.254.0.0/16" },

    // RFC 2544 Benchmarking
    { tag: "reserve", type: "IPv4", cidr: "198.18.0.0/15" },

    // RFC 5771 Multicast
    { tag: "reserve", type: "IPv4", cidr: "224.0.0.0/4" },

    // RFC 1112 Reserved for Future Use (Class E)
    { tag: "reserve", type: "IPv4", cidr: "240.0.0.0/4" },

    // RFC 919 Limited Broadcast
    { tag: "reserve", type: "IPv4", cidr: "255.255.255.255/32" },

    // RFC 4291 Loopback
    { tag: "reserve", type: "IPv6", cidr: "::1/128" },

    // RFC 4291 Unspecified Address
    { tag: "reserve", type: "IPv6", cidr: "::/128" },

    // RFC 4193 Unique Local Address
    { tag: "reserve", type: "IPv6", cidr: "fc00::/7" },

    // RFC 4291 Link-Local
    { tag: "reserve", type: "IPv6", cidr: "fe80::/10" },

    // RFC 4291 Multicast
    { tag: "reserve", type: "IPv6", cidr: "ff00::/8" },
];
