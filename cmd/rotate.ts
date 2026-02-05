import { Command } from "@cliffy/command";
import { asPageIndices, withSuffix } from "../helper.ts";
import { PDFDocument, degrees } from "pdf-lib";
import { sprintf } from "@std/fmt/printf";

const checkDegree = (degree: number): boolean => {
  const d = (360 + degree) % 360;
  return d % 90 == 0;
};

const rotatePages = async (
  path: string,
  degree: number,
  range: string,
): Promise<string | null> => {
  const baseData = await Deno.readFile(path);
  const baseDoc = await PDFDocument.load(baseData);
  const outDoc = await PDFDocument.create();

  const pages = await outDoc.copyPages(baseDoc, baseDoc.getPageIndices());

  const targets = asPageIndices(range, baseDoc.getPageCount());

  pages.forEach((page, i) => {
    const added = outDoc.addPage(page);
    if (targets.includes(i)) {
      added.setRotation(degrees(page.getRotation().angle + degree));
    }
  });

  const bytes = await outDoc.save();
  const suf = sprintf("_rotate%03d", degree);
  const outPath = withSuffix(path, suf);
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const rotateCommand = new Command()
  .description("rotate page(s) of a pdf file.")
  .arguments("<path:string>")
  .option("-d, --degree <degree:integer>", "-90, 90, 180, ... in crockwise.", {
    default: 90,
  })
  .option(
    "-r, --range <range:string>",
    "Page ranges (1-based); comma-separated, hyphen ranges, negative = from end. e.g. 1-3,5,7-,-1",
    {
      default: "1-",
    },
  )
  .action(async (options, path) => {
    if (!checkDegree(options.degree)) {
      console.error("Invalid degree (must be 90-unit)", options.degree);
      Deno.exit(1);
    }
    const result = await rotatePages(path, options.degree, options.range);

    if (result === null) {
      console.error("Failed to rotate!");
      Deno.exit(1);
    }

    console.log(`Rotated: ${result}`);
  });
