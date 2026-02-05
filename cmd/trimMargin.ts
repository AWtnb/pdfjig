import { Command } from "@cliffy/command";
import { PDFDocument, PDFPage } from "pdf-lib";
import { withSuffix } from "../helper.ts";

interface PageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const toPageBox = (
  x: number,
  y: number,
  width: number,
  height: number,
): PageBox => {
  return { x: x, y: y, width: width, height: height };
};

const isValidMargin = (margin: string): boolean => {
  const nums = margin.split(",").map((v) => Number(v.trim()));
  if (nums.some((n) => Number.isNaN(n) || n < 0)) {
    return false;
  }
  return nums.length === 1 || nums.length === 2 || nums.length === 4;
};

const parseMargin = (margin: string): [number, number, number, number] => {
  const nums = margin.split(",").map((v) => Number(v.trim()));

  switch (nums.length) {
    case 1:
      return [nums[0], nums[0], nums[0], nums[0]];
    case 2:
      return [nums[0], nums[1], nums[0], nums[1]];
    case 4:
      return [nums[0], nums[1], nums[2], nums[3]];
    default:
      throw new Error("Invalid margin format"); // fallback
  }
};

const applyMargin = (box: PageBox, margin: string): PageBox => {
  const [top, right, bottom, left] = parseMargin(margin);

  const topPx = (top / 100) * box.height;
  const rightPx = (right / 100) * box.width;
  const bottomPx = (bottom / 100) * box.height;
  const leftPx = (left / 100) * box.width;

  return toPageBox(
    box.x + leftPx,
    box.y + bottomPx,
    box.width - leftPx - rightPx,
    box.height - topPx - bottomPx,
  );
};

const trimMargin = async (
  path: string,
  margin: string,
): Promise<string | null> => {
  if (!isValidMargin(margin)) {
    console.log("Invalid margin:", margin);
    return null;
  }

  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();
  const range = srcDoc.getPageIndices();
  const pages = await outDoc.copyPages(srcDoc, range);

  pages.forEach((page: PDFPage) => {
    const mbox = page.getMediaBox();
    const newbox = applyMargin(mbox, margin);
    if (newbox === null) {
      console.log("Invalid margin!");
      return;
    }
    page.setMediaBox(newbox.x, newbox.y, newbox.width, newbox.height);
    outDoc.addPage(page);
  });
  const bytes = await outDoc.save();
  const outPath = withSuffix(path, "_trimmargin");
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const trimMarginCommand = new Command()
  .description("trim margin of all page of a pdf.")
  .arguments("<path:string>")
  .option(
    "-m, --margin <margin:string>",
    "margins to trim (ratio to page size, comma-separated css-margin-style)",
    {
      default: "",
    },
  )
  .action(async (options, path) => {
    const result = await trimMargin(path, options.margin);
    console.log(`Embedded: ${result}`);
  });
