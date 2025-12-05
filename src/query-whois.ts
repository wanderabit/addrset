import type { Site } from "@/utils/site";
import fs from "fs";
import ky from "ky";
import path from "path";
import YAML from "yaml";

//@ts-ignore
import psl from "psl";

const siteFiles = await fs.promises.readdir("./data/site").then((lst) => lst.sort((a, b) => a.localeCompare(b)));
const site: Record<string, Site> = {};

for (const n of siteFiles) {
    const txt = await fs.promises.readFile(path.join("./data/site", n), "utf-8");
    for (const s of YAML.parseAllDocuments(txt).map((d) => d.toJS() as Site)) {
        if (!s.name) continue;
        site[s.name] = s;
    }
}

const lst: Site[] = Object.values(site).filter((s) => s.tag?.includes("site-google"));
const domain: string[] = lst
    .flatMap((s) => s.domain || [])
    .map((d) => d.replace(/^\./, ""))
    .map((d) => psl.parse(d).domain || d);

for (const d of domain) {
    try {
        const resp = await ky.get("https://v2.xxapi.cn/api/whois", {
            throwHttpErrors: false,
            searchParams: {
                domain: d,
            },
        });

        if (resp.status != 200) {
            console.log(d.padEnd(24), `query api http status ${resp.status}`);
            continue;
        }

        const data: any = await resp.json();
        const registrant = data?.data?.data?.registrant || "unknown";
        const ns = data?.data?.data?.dns_serve || [];

        console.log(d.padEnd(24), registrant.padEnd(20), ns.slice(0, 2).join(", ").toLowerCase());
    } catch (err) {
        console.log(d.padEnd(24), `query api error: ${err}`);
    }
}
