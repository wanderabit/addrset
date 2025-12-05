import { isIPv4, isIPv6 } from "@/utils/ip";
import { writeSite } from "@/utils/output";
import type { Site } from "@/utils/site";
import fs from "fs";
import path from "path";
import YAML from "yaml";

const filelst = await fs.promises.readdir("./data/site").then((lst) => lst.sort((a, b) => a.localeCompare(b)));
const site: Record<string, Site> = {};

for (const n of filelst) {
    const txt = await fs.promises.readFile(path.join("./data/site", n), "utf-8");
    for (const s of YAML.parseAllDocuments(txt).map((d) => d.toJS() as Site)) {
        if (!s.name) continue;
        site[s.name] = s;
    }
}

const btTrackerList = fs
    .readFileSync("./dist/bttracker/all.txt", "utf-8")
    .split("\n")
    .filter((l) => !!l);

site["bttracker"] = {
    name: "bttracker",
    tag: ["category-bttracker"],
    cidr: [],
    domain: [],
};

for (const l of btTrackerList) {
    const url = new URL(l);
    const hostname = url.hostname.replace(/^\[|]$/g, ""); // remove brackets for IPv6
    if (isIPv4(hostname)) {
        site["bttracker"].cidr!.push(`${hostname}/32`);
    } else if (isIPv6(hostname)) {
        site["bttracker"].cidr!.push(`${hostname}/128`);
    } else if (hostname.split(".").length >= 1) {
        site["bttracker"].domain!.push(`.${hostname}`);
    } else {
        console.warn(`bt tracker invalid hostname: ${hostname}`);
    }
}

await writeSite(site);
