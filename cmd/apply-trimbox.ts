import { Command } from "@cliffy/command";
import { PDFDocument, PDFPage, rectanglesAreEqual } from "pdf-lib";
import { withSuffix } from "../helper.ts";

const applyTrimbox = async (path: string): Promise<string> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();
  const range = srcDoc.getPageIndices();
  const pages = await outDoc.copyPages(srcDoc, range);

  pages.forEach((page: PDFPage, idx: number) => {
    const mbox = page.getMediaBox();
    const tbox = page.getTrimBox();
    if (rectanglesAreEqual(mbox, tbox)) {
      console.log(`UNCHANGED: page ${idx + 1} has no trimbox.`);
    } else {
      page.setMediaBox(tbox.x, tbox.y, tbox.width, tbox.height);
      page.setCropBox(tbox.x, tbox.y, tbox.width, tbox.height);
      page.setBleedBox(tbox.x, tbox.y, tbox.width, tbox.height);
    }
    outDoc.addPage(page);
  });
  const bytes = await outDoc.save();
  const outPath = withSuffix(path, "_trimbox");
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const applyTrimboxCommand = new Command()
  .description("apply trimbox to each page of a pdf.")
  .arguments("<path:string>")
  .action(async (_, path) => {
    const result = await applyTrimbox(path);
    console.log(`Applied trimbox: ${result}`);
  });
