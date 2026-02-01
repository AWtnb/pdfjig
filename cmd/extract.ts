import { Command } from "@cliffy/command";
import { PDFPage, PDFDocument } from "pdf-lib";
import { sprintf } from "@std/fmt/printf";
import { withSuffix } from "../helper.ts";

const extractPages = async (
  path: string,
  fromIdx: number,
  toIdx: number,
): Promise<number> => {
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
    return 1;
  }
  const pages = await outDoc.copyPages(srcDoc, range);

  pages.forEach((page: PDFPage) => {
    outDoc.addPage(page);
  });
  const bytes = await outDoc.save();
  const suf = sprintf("_p%03d-p%03d", fromIdx + 1, toIdx + 1);
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return 0;
};

const nombreToPageIndex = (nombre: number): number => {
  if (0 < nombre) {
    return nombre - 1;
  }
  return nombre;
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
    const fromIdx = nombreToPageIndex(options.from);
    const toIdx = nombreToPageIndex(options.to);

    const result = await extractPages(path, fromIdx, toIdx);

    if (result !== 0) {
      console.error("Failed to extract!");
      Deno.exit(result);
    }

    console.log(`Extracted: ${path} pp.${options.from}-${options.to}`);
  });
