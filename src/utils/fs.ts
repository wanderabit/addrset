import fs from "fs";

export async function makeDir(p: string) {
    const exists = await fs.promises
        .access(p)
        .then(() => true)
        .catch(() => false);
    if (!exists) await fs.promises.mkdir(p, { recursive: true });
}

export async function makeAndCleanDir(p: string) {
    const exists = await fs.promises
        .access(p)
        .then(() => true)
        .catch(() => false);
    if (exists) await fs.promises.rm(p, { recursive: true, force: true });
    await fs.promises.mkdir(p, { recursive: true });
}
