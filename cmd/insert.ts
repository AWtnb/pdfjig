import { existsSync } from "@std/fs";
import { Command } from "@cliffy/command";
import { asPageIndex, withSuffix } from "../helper.ts";
import { PDFDocument } from "pdf-lib";

const insertPages = async (
  path: string,
  insert: string,
  start: number,
): Promise<string> => {
  const baseData = await Deno.readFile(path);
  const baseDoc = await PDFDocument.load(baseData);
  const baseCount = baseDoc.getPageCount();
  const insertData = await Deno.readFile(insert);
  const insertDoc = await PDFDocument.load(insertData);

  const insertPos = asPageIndex(start, baseCount);
  const outDoc = await PDFDocument.create();

  (
    await outDoc.copyPages(
      baseDoc,
      baseDoc
        .getPageIndices()
        .filter((idx: number) => idx < insertPos)
        .map((idx: number) => idx),
    )
  ).forEach((page) => {
    outDoc.addPage(page);
  });

  (await outDoc.copyPages(insertDoc, insertDoc.getPageIndices())).forEach(
    (page) => {
      outDoc.addPage(page);
    },
  );

  (
    await outDoc.copyPages(
      baseDoc,
      baseDoc
        .getPageIndices()
        .filter((idx: number) => insertPos <= idx)
        .map((idx: number) => idx),
    )
  ).forEach((page) => {
    outDoc.addPage(page);
  });

  const bytes = await outDoc.save();
  const suf = "_inserted";
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const insertCommand = new Command()
  .description("insert page(s) to a pdf file.")
  .arguments("<path:string>")
  .option("-f, --file <file:string>", "file to insert", {
    default: "",
  })
  .option(
    "-s, --start <start:integer>",
    "start page of insertion (1-origin, -1 is last page)",
    {
      default: 1,
    },
  )
  .action(async (options, path) => {
    for (const p of [path, options.file]) {
      if (!existsSync(p)) {
        console.error("Not found:", p);
        Deno.exit(1);
      }
    }

    const result = await insertPages(path, options.file, options.start);
    console.log(`Inserted: ${result}`);
  });
