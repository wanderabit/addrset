import { makeAndCleanDir } from "@/utils/fs";
import { RIR } from "@/utils/ip";
import fs from "fs";
import ky from "ky";

await makeAndCleanDir("./dist/rir");

await Promise.all(
    Object.entries(RIR).map(async ([name, url]) => {
        const resp = await ky.get(url);
        const data = await resp.text();
        await fs.promises.writeFile(`./dist/rir/delegated-${name}-extended-latest`, data);
        console.log(`Download delegated-${name}-extended-latest finish`);
    }),
);
