import { Command } from "@cliffy/command";
import { asPageIndex, withSuffix } from "../helper.ts";
import { PDFDocument } from "pdf-lib";

const swapPages = async (
  path: string,
  embedFilePath: string,
  start: number,
): Promise<string | null> => {
  const baseData = await Deno.readFile(path);
  const baseDoc = await PDFDocument.load(baseData);
  const baseCount = baseDoc.getPageCount();
  const embedData = await Deno.readFile(embedFilePath);
  const embedDoc = await PDFDocument.load(embedData);
  const embedCount = embedDoc.getPageCount();

  const startIdx = asPageIndex(start, baseCount);
  const outDoc = await PDFDocument.create();

  (
    await outDoc.copyPages(
      baseDoc,
      baseDoc
        .getPageIndices()
        .filter((idx: number) => idx < startIdx)
        .map((idx: number) => idx),
    )
  ).forEach((page) => outDoc.addPage(page));

  (await outDoc.copyPages(embedDoc, embedDoc.getPageIndices())).forEach(
    (page) => outDoc.addPage(page),
  );

  (
    await outDoc.copyPages(
      baseDoc,
      baseDoc
        .getPageIndices()
        .filter((idx: number) => startIdx + embedCount - 1 < idx)
        .map((idx: number) => idx),
    )
  ).forEach((page) => outDoc.addPage(page));

  const bytes = await outDoc.save();
  const suf = "_swap";
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const swapCommand = new Command()
  .description("swap page(s) of a pdf with another file.")
  .arguments("<path:string>")
  .option("-f, --file <file:string>", "file to embed", { default: "" })
  .option(
    "-s, --start <start:integer>",
    "start page of swap (1-origin, -1 is last page)",
    {
      default: 1,
    },
  )
  .action(async (options, path) => {
    const result = await swapPages(path, options.file, options.start);

    if (result === null) {
      console.error("Failed to embed!");
      Deno.exit(1);
    }

    console.log(`Embedded: ${result}`);
  });
