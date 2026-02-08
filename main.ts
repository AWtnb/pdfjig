import { Command } from "@cliffy/command";
import { applyTrimboxCommand } from "./cmd/applytrimbox.ts";
import { concCommand } from "./cmd/conc.ts";
import { extractCommand } from "./cmd/extract.ts";
import { insertCommand } from "./cmd/insert.ts";
import { rotateCommand } from "./cmd/rotate.ts";
import { splitCommand } from "./cmd/split.ts";
import { spreadCommand } from "./cmd/spread.ts";
import { swapCommand } from "./cmd/swap.ts";
import { trimMarginCommand } from "./cmd/trimMargin.ts";
import { unzipCommand } from "./cmd/unzip.ts";
import { watermarkCommand } from "./cmd/watermark.ts";

await new Command()
  .name("pdfjig")
  .description("jig for PDF handling.")
  .command("apply-trimbox", applyTrimboxCommand)
  .command("conc", concCommand)
  .command("extract", extractCommand)
  .command("insert", insertCommand)
  .command("rotate", rotateCommand)
  .command("split", splitCommand)
  .command("spread", spreadCommand)
  .command("swap", swapCommand)
  .command("trim-margin", trimMarginCommand)
  .command("unzip", unzipCommand)
  .command("watermark", watermarkCommand)
  .parse(Deno.args);
