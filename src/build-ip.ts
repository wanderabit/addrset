import { RIR, StaticBlock, parseRirData, type Block } from "@/utils/ip";
import { writeIP } from "@/utils/output";
import fs from "fs";

let block: Block[] = [...StaticBlock];
for (const k of Object.keys(RIR)) {
    const blk = parseRirData(await fs.promises.readFile(`./dist/rir/delegated-${k}-extended-latest`, "utf-8"));
    block = block.concat(blk);
}

console.log(`found ${block.length} blocks.`);

await writeIP(block);
