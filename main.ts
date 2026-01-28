import { Command } from "@cliffy/command";
import { concCommand } from "./cmd/conc.ts";
import { cropCommand } from "./cmd/crop.ts";
import { extractCommand } from "./cmd/extract.ts";
import { insertCommand } from "./cmd/insert.ts";
import { rotateCommand } from "./cmd/rotate.ts";
import { spreadCommand } from "./cmd/spread.ts";
import { swapCommand } from "./cmd/swap.ts";
import { unspreadCommand } from "./cmd/unspread.ts";
import { watermarkCommand } from "./cmd/watermark.ts";

await new Command()
    .name("pdfjig")
    .description("jig for PDF handling.")
    .command("conc", concCommand)
    .command("crop", cropCommand)
    .command("extract", extractCommand)
    .command("insert", insertCommand)
    .command("rotate", rotateCommand)
    .command("spread", spreadCommand)
    .command("swap", swapCommand)
    .command("unspread", unspreadCommand)
    .command("watermark", watermarkCommand)
    .parse(Deno.args);
