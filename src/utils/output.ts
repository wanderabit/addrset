import { makeAndCleanDir, makeDir } from "@/utils/fs";
import type { Block } from "@/utils/ip";
import { CIDR, Domain, type Site } from "@/utils/site";
import { mergeCidr } from "cidr-tools";
import fs from "fs";
import YAML from "yaml";

export async function writeIP(block: Block[]) {
    await makeAndCleanDir("./dist/ip/v4");
    await makeAndCleanDir("./dist/ip/v6");
    await makeAndCleanDir("./dist/ip/json");
    await makeDir("./dist/clash");
    await fs.promises
        .readdir("./dist/clash")
        .then((lst) => lst.filter((f) => f.startsWith("ip-")))
        .then((lst) => Promise.all(lst.map((f) => fs.promises.rm(`./dist/clash/${f}`))));

    await fs.promises.writeFile("./dist/ip/json/block.json", JSON.stringify(block));

    const tagset = new Set<string>();

    for (const b of block) {
        tagset.add(b.tag);
    }

    console.log(`found ${tagset.size} tags.`);

    const tag: Record<string, { ipv4: string[]; ipv6: string[] }> = {};
    let blockCount = 0;

    for (const t of tagset) {
        tag[t] = { ipv4: [], ipv6: [] };
        const data = block.filter((b) => b.tag === t);
        const v4 = (tag[t].ipv4 = mergeCidr(data.filter((b) => b.type === "IPv4").map((b) => b.cidr)));
        const v6 = (tag[t].ipv6 = mergeCidr(data.filter((b) => b.type === "IPv6").map((b) => b.cidr)));

        await fs.promises.writeFile(`./dist/ip/v4/${t}.txt`, v4.join("\n"));
        await fs.promises.writeFile(`./dist/ip/v6/${t}.txt`, v6.join("\n"));

        await fs.promises.writeFile(
            `./dist/clash/ip-${t}.yaml`,
            YAML.stringify({
                payload: [
                    ...v4.map((i) => new CIDR(i, 4)).map((i) => i.toClashRule()),
                    ...v6.map((i) => new CIDR(i, 6)).map((i) => i.toClashRule()),
                ],
            }),
        );

        blockCount += v4.length + v6.length;
    }

    await fs.promises.writeFile("./dist/ip/json/tag.json", JSON.stringify(tag));

    console.log(`wrote a total of ${blockCount} merged blocks.`);
}

export async function writeSite(site: Record<string, Site>) {
    await makeAndCleanDir("./dist/site/json");
    await makeDir("./dist/clash");
    await fs.promises
        .readdir("./dist/clash")
        .then((lst) => lst.filter((f) => !f.startsWith("ip-")))
        .then((lst) => Promise.all(lst.map((f) => fs.promises.rm(`./dist/clash/${f}`))));

    const tagset = new Set<string>();

    for (const s of Object.values(site)) {
        if (!s.tag || s.tag.length === 0) continue;
        s.tag.forEach((t) => tagset.add(t));
    }

    console.log(`found ${tagset.size} tags in site data.`);

    for (const t of tagset) {
        const lst = Object.values(site).filter((s) => s.tag && s.tag.includes(t));
        const cidr: CIDR[] = [];
        const domain: Domain[] = [];

        for (const s of lst) {
            if (s.cidr && s.cidr.length > 0) s.cidr.forEach((s) => cidr.push(CIDR.fromString(s)));
            if (s.domain && s.domain.length > 0) s.domain.forEach((s) => domain.push(Domain.fromString(s)));
        }

        await fs.promises.writeFile(
            `./dist/site/json/${t}.json`,
            JSON.stringify({
                cidr: cidr.map((i) => i.toString()),
                domain: domain.map((i) => i.toString()),
            }),
        );

        await fs.promises.writeFile(
            `./dist/clash/${t}.yaml`,
            YAML.stringify({
                payload: [...cidr.map((i) => i.toClashRule()), ...domain.map((i) => i.toClashRule())],
            }),
        );
    }
}
