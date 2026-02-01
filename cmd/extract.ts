import { Command } from "@cliffy/command";
import { PDFPage, PDFDocument } from "pdf-lib";
import { asPageIndices, withSuffix } from "../helper.ts";

const extractPages = async (
  path: string,
  range: string,
): Promise<string | null> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();
  const pCount = srcDoc.getPageCount();

  const targets = asPageIndices(range, pCount);
  const indices = srcDoc.getPageIndices().filter((i) => {
    return targets.includes(i);
  });

  if (indices.length < 1) {
    console.error("invalid range:", range);
    return null;
  } else {
    console.log(
      "target pages:",
      indices.map((i) => i + 1),
    );
  }
  const pages = await outDoc.copyPages(srcDoc, indices);

  pages.forEach((page: PDFPage) => {
    outDoc.addPage(page);
  });
  const bytes = await outDoc.save();
  const suf = "_extracted";
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const extractCommand = new Command()
  .description("extract page(s) from pdf file.")
  .arguments("<path:string>")
  .option(
    "-r, --range <range:string>",
    "extract range (1-origin, comma-sep, dash-joined)",
    {
      default: "1--1",
    },
  )
  .action(async (options, path) => {
    const result = await extractPages(path, options.range);

    if (result === null) {
      console.error("Failed to extract!");
      Deno.exit(1);
    }

    console.log(`Extracted: ${result}`);
  });
