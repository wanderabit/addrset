import { makeAndCleanDir } from "@/utils/fs";
import { RIR } from "@/utils/ip";
import fs from "fs";
import ky from "ky";

await makeAndCleanDir("./dist/rir");

async function download(url: string, path: string) {
    let retry = 0;

    while (true) {
        if (retry >= 3) {
            throw new Error(`Download ${url} failed after ${retry} attempts`);
        }

        try {
            retry += 1;
            console.log(`Download ${url} to ${path}`);
            const resp = await ky.get(url, { retry: 5, timeout: 1000 * 60 });
            const data = await resp.text();
            await fs.promises.writeFile(path, data);
            console.log(`Download ${path} finish`);
            return;
        } catch (err) {
            console.error(`Download ${url} occurred error on attempt ${retry}:`, err);
        }
    }
}

await Promise.all(Object.entries(RIR).map(([name, url]) => download(url, `./dist/rir/delegated-${name}-extended-latest`)));
