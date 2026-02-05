import { Command } from "@cliffy/command";
import { withSuffix } from "../helper.ts";
import {
  PDFDocument,
  PDFPage,
  PageBoundingBox,
  TransformationMatrix,
} from "pdf-lib";

type PagePair = [PDFPage, PDFPage];

const getPageDimensions = (page: PDFPage) => {
  const mbox = page.getMediaBox();
  return { width: mbox.width, height: mbox.height };
};

const getSpreadDimensions = (
  pair: PagePair,
  vertical: boolean,
): [number, number] => {
  const [pageA, pageB] = pair.map(getPageDimensions);

  if (vertical) {
    return [Math.max(pageA.width, pageB.width), pageA.height + pageB.height];
  }

  return [pageA.width + pageB.width, Math.max(pageA.height, pageB.height)];
};

const createBoundingBox = (page: PDFPage): PageBoundingBox => {
  const mbox = page.getMediaBox();
  return {
    left: mbox.x,
    bottom: mbox.y,
    right: mbox.x + mbox.width,
    top: mbox.y + mbox.height,
  };
};

const createTransformMatrix = (
  basePage: PDFPage,
  vertical: boolean,
): [TransformationMatrix, TransformationMatrix] => {
  const identity: TransformationMatrix = [1, 0, 0, 1, 0, 0];

  if (vertical) {
    return [[1, 0, 0, 1, 0, basePage.getHeight()], identity];
  }

  return [identity, [1, 0, 0, 1, basePage.getWidth(), 0]];
};

const arrangePair = (pages: PagePair, opposite: boolean): PagePair => {
  const arranged: PagePair = opposite ? [pages[1], pages[0]] : pages;
  return arranged;
};

const createSpreadPage = async (
  outDoc: PDFDocument,
  pair: PagePair,
  vertical: boolean,
) => {
  const dimensions = getSpreadDimensions(pair, vertical);
  const spreadPage = outDoc.addPage(dimensions);
  spreadPage.setRotation(pair[0].getRotation());

  const boundingBoxes = pair.map(createBoundingBox);
  const matrices = createTransformMatrix(pair[0], vertical);
  (await outDoc.embedPages(pair, boundingBoxes, matrices)).forEach(
    (embeddable) => {
      spreadPage.drawPage(embeddable);
    },
  );

  return spreadPage;
};

const hasHiddenRotation = (page: PDFPage): boolean => {
  const a = page.getRotation().angle;
  return a == 90 || a == 270 || a == -90;
};

const spread = async (
  path: string,
  vertical: boolean,
  singleTopPage: boolean,
  opposite: boolean,
): Promise<string> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();

  const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());

  if (singleTopPage && 0 < pages.length) {
    outDoc.addPage(pages.shift()!);
  }

  for (let i = 0; i < pages.length; i += 2) {
    const page = pages[i];
    if (i + 1 == pages.length) {
      outDoc.addPage(page);
      continue;
    }

    const pair = arrangePair([pages[i], pages[i + 1]], opposite);
    const v = pair.some(hasHiddenRotation) ? !vertical : vertical;
    await createSpreadPage(outDoc, pair, v);
  }

  const bytes = await outDoc.save();
  const outPath = withSuffix(path, "_spread");
  await Deno.writeFile(outPath, bytes);
  return outPath;
};

export const spreadCommand = new Command()
  .description("spread page(s) to a pdf file.")
  .arguments("<path:string>")
  .option("-s, --single-top", "skip spreading on top page (book-like)")
  .option("-v, --vertical", "spread vertically (top to bottom)")
  .option("-o, --opposite", "spread right to left (if -v, bottom to top)")
  .action(async (options, path) => {
    const result = await spread(
      path,
      !!options.vertical,
      !!options.singleTop,
      !!options.opposite,
    );

    console.log(`Spread: ${result}`);
  });
