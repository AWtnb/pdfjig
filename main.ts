import { Command } from "@cliffy/command";
import { concCommand } from "./cmd/conc.ts";
import { trimMarginCommand } from "./cmd/trimMargin.ts";
import { applyTrimboxCommand } from "./cmd/applytrimbox.ts";
import { extractCommand } from "./cmd/extract.ts";
import { insertCommand } from "./cmd/insert.ts";
import { rotateCommand } from "./cmd/rotate.ts";
import { spreadCommand } from "./cmd/spread.ts";
import { swapCommand } from "./cmd/swap.ts";
import { splitCommand } from "./cmd/split.ts";
import { unzipCommand } from "./cmd/unzip.ts";
import { watermarkCommand } from "./cmd/watermark.ts";

await new Command()
  .name("pdfjig")
  .description("jig for PDF handling.")
  .command("conc", concCommand)
  .command("trim-margin", trimMarginCommand)
  .command("apply-trimbox", applyTrimboxCommand)
  .command("extract", extractCommand)
  .command("insert", insertCommand)
  .command("rotate", rotateCommand)
  .command("spread", spreadCommand)
  .command("swap", swapCommand)
  .command("split", splitCommand)
  .command("unzip", unzipCommand)
  .command("watermark", watermarkCommand)
  .parse(Deno.args);
