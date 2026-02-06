import { Command } from "@cliffy/command";
import { PDFDocument, PDFPage } from "pdf-lib";
import { withSuffix } from "../helper.ts";

const extractPages = async (
  path: string,
  even: boolean,
): Promise<string | null> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);

  const range = srcDoc.getPageIndices().filter((idx: number) => {
    return even == ((idx + 1) % 2 == 0);
  });

  if (0 < range.length) {
    const outDoc = await PDFDocument.create();
    const pages = await outDoc.copyPages(srcDoc, range);

    pages.forEach((page: PDFPage) => {
      outDoc.addPage(page);
    });
    const bytes = await outDoc.save();
    const suf = even ? "_even" : "_odd";
    const outPath = withSuffix(path, suf);

    await Deno.writeFile(outPath, bytes);
    return outPath;
  }
  return null;
};

export const unzipCommand = new Command()
  .description("extract odd and even pages of the pdf into separate files.")
  .arguments("<path:string>")
  .action(async (_, path) => {
    for (const evenFlag of [true, false]) {
      const result = await extractPages(path, evenFlag);
      if (result !== null) {
        console.log(`Unzipped: ${result}`);
      }
    }
  });
