import { makeAndCleanDir } from "@/utils/fs";
import fs from "fs";
import ky from "ky";

await makeAndCleanDir("./dist/bttracker");

const resp = await ky.get("https://cf.trackerslist.com/all.txt");
const data = await resp.text();

await fs.promises.writeFile(`./dist/bttracker/all.txt`, data);
