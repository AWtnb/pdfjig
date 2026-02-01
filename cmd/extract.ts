import { existsSync } from "@std/fs";
import { Command } from "@cliffy/command";
import { PDFPage, PDFDocument } from "pdf-lib";
import { sprintf } from "@std/fmt/printf";
import { asPageIndex, withSuffix } from "../helper.ts";

const extractPages = async (
  path: string,
  fromIdx: number,
  toIdx: number,
): Promise<string | null> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();
  const pCount = srcDoc.getPageCount();

  if (fromIdx < 0) {
    fromIdx = pCount + fromIdx;
  }
  if (toIdx < 0) {
    toIdx = pCount + toIdx;
  }
  const range = srcDoc.getPageIndices().filter((idx: number) => {
    return fromIdx <= idx && idx <= toIdx;
  });
  if (range.length < 1) {
    console.error("invalid range!");
    return null;
  }
  const pages = await outDoc.copyPages(srcDoc, range);

  pages.forEach((page: PDFPage) => {
    outDoc.addPage(page);
  });
  const bytes = await outDoc.save();
  const suf = sprintf("_p%03d-p%03d", fromIdx + 1, toIdx + 1);
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const extractCommand = new Command()
  .description("extract page(s) from pdf file.")
  .arguments("<path:string>")
  .option("-f, --from <from:integer>", "start of extract (1-origin)", {
    default: 1,
  })
  .option(
    "-t, --to <to:integer>",
    "end of extract (1-origin, -1 is last page)",
    {
      default: -1,
    },
  )
  .action(async (options, path) => {
    const fromIdx = asPageIndex(options.from);
    const toIdx = asPageIndex(options.to);
    if (!existsSync(path)) {
      console.error("Not found:", path);
      Deno.exit(1);
    }

    const result = await extractPages(path, fromIdx, toIdx);

    if (result === null) {
      console.error("Failed to extract!");
      Deno.exit(1);
    }

    console.log(`Extracted: ${result}`);
  });
