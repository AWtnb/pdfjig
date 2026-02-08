import { Command } from "@cliffy/command";
import { PDFDocument, PDFPage } from "pdf-lib";
import {
  getHiddenRotation,
  HiddenRotationDegree,
  withSuffix,
} from "../helper.ts";

class PageSize {
  readonly variants: number[];

  constructor(pages: PDFPage[], vertical: boolean) {
    const dims = pages.map((page) =>
      vertical ? page.getHeight() : page.getWidth(),
    );
    this.variants = [...new Set(dims)];
  }

  getMax(): number {
    return Math.max(...this.variants);
  }

  getMin(): number {
    return Math.min(...this.variants);
  }
}

const isPageSingled = (page: PDFPage, vertical: boolean): boolean => {
  const mbox = page.getMediaBox();
  const tbox = page.getTrimBox();
  const dimension = vertical ? "height" : "width";
  return tbox[dimension] < mbox[dimension] / 2;
};

type CropParams = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const embedCroppedPage = async (
  outDoc: PDFDocument,
  page: PDFPage,
  { x, y, width, height }: CropParams,
) => {
  const added = outDoc.addPage([width, height]);
  added.setRotation(page.getRotation());

  const mbox = page.getMediaBox();
  const embedded = await outDoc.embedPage(page, {
    left: mbox.x + x,
    bottom: mbox.y + y,
    right: mbox.x + x + width,
    top: mbox.y + y + height,
  });

  added.drawPage(embedded);
};

const getCropParams = (
  page: PDFPage,
  vertical: boolean,
  offset: number,
  halfDim: number,
): CropParams => {
  const otherDim = vertical ? page.getWidth() : page.getHeight();
  return {
    x: vertical ? 0 : offset,
    y: vertical ? offset : 0,
    width: vertical ? otherDim : halfDim,
    height: vertical ? halfDim : otherDim,
  };
};

const processSpreadPage = async (
  outDoc: PDFDocument,
  page: PDFPage,
  hiddenRotation: HiddenRotationDegree | null,
  vertical: boolean,
  opposite: boolean,
) => {
  const dimension = vertical ? page.getHeight() : page.getWidth();
  const halfDim = Math.floor(dimension / 2);

  if (hiddenRotation == 270 || (hiddenRotation === null && vertical)) {
    // Since PDF coordinate system starts from bottom-left,
    // when rotated 270 degrees, processing from the "far side" first gives a more natural result.
    opposite = !opposite;
  }
  const offsets = opposite ? [halfDim, 0] : [0, halfDim];

  for (const offset of offsets) {
    const params = getCropParams(page, vertical, offset, halfDim);
    await embedCroppedPage(outDoc, page, params);
  }
};

const processSingledPage = async (
  outDoc: PDFDocument,
  page: PDFPage,
  vertical: boolean,
  idx: number,
) => {
  console.log(`- Note: page ${idx + 1} is non-spreaded.`);

  const dimension = vertical ? page.getHeight() : page.getWidth();
  const quarter = Math.floor(dimension / 4);
  const halfDim = Math.floor(dimension / 2);

  const params = getCropParams(page, vertical, quarter, halfDim);
  await embedCroppedPage(outDoc, page, params);
};

const splitEachPage = async (
  path: string,
  vertical: boolean,
  opposite: boolean,
): Promise<string> => {
  console.log(`Splitting pages: ${path}`);

  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();

  const range = srcDoc.getPageIndices();
  const pages = await outDoc.copyPages(srcDoc, range);

  const hasHiddenRotation = pages.some((page) => {
    return getHiddenRotation(page) !== null;
  });

  if (hasHiddenRotation) vertical = !vertical;

  const sizes = new PageSize(pages, vertical);

  for (const [idx, page] of pages.entries()) {
    const dimension = vertical ? page.getHeight() : page.getWidth();

    // Skip minimal size pages
    if (sizes.variants.length > 1 && dimension === sizes.getMin()) {
      console.log(`- Skip: page ${idx + 1} is minimal size.`);
      outDoc.addPage(page);
      continue;
    }

    // Process singled pages
    if (isPageSingled(page, vertical)) {
      await processSingledPage(outDoc, page, vertical, idx);
      continue;
    }

    // Process spread pages
    await processSpreadPage(
      outDoc,
      page,
      getHiddenRotation(page),
      vertical,
      opposite,
    );
  }

  const bytes = await outDoc.save();
  const outPath = withSuffix(path, "_split");
  await Deno.writeFile(outPath, bytes);

  return outPath;
};

export const splitCommand = new Command()
  .description("half-split pages of a pdf.")
  .arguments("<path:string>")
  .option("-v, --vertical", "split upside and downside.")
  .option("-o, --opposite", "arrange each split page pair in opposite order.")
  .action(async (options, path) => {
    const result = await splitEachPage(
      path,
      !!options.vertical,
      !!options.opposite,
    );
    console.log(`Split: ${result}`);
  });
