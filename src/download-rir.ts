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

        console.log(`Download ${url} to ${path}`);
        
        retry += 1;
        console.log(`Download ${url} attempt ${retry}`);

        if (retry > 1) {
            const delay = 2000 * (retry - 1);
            console.log(`Wait for ${delay} ms before retrying`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        try {
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
