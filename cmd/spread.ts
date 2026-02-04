import { Command } from "@cliffy/command";
import { withSuffix } from "../helper.ts";
import {
  PDFDocument,
  PDFPage,
  PageBoundingBox,
  TransformationMatrix,
} from "pdf-lib";

const getSpreadPageSize = (
  pages: [PDFPage, PDFPage],
  vertical: boolean,
): [number, number] => {
  const mboxA = pages[0].getMediaBox();
  const mboxB = pages[1].getMediaBox();
  const width = vertical
    ? Math.max(mboxA.width, mboxB.width)
    : mboxA.width + mboxB.width;
  const height = vertical
    ? mboxA.height + mboxB.height
    : Math.max(mboxA.height, mboxB.height);
  return [width, height];
};

const getBoundingBox = (page: PDFPage): PageBoundingBox => {
  const mbox = page.getMediaBox();
  return {
    left: mbox.x,
    bottom: mbox.y,
    right: mbox.x + mbox.width,
    top: mbox.y + mbox.height,
  };
};

const getBoundingBoxes = (pages: [PDFPage, PDFPage]): PageBoundingBox[] => {
  return pages.map((page) => getBoundingBox(page));
};

const getTransformationMatrix = (
  w: number = 0,
  h: number = 0,
): TransformationMatrix => {
  return [1, 0, 0, 1, w, h];
};

const toTransformationMatrixes = (
  base: PDFPage,
  vertical: boolean,
): [TransformationMatrix, TransformationMatrix] => {
  const mat = getTransformationMatrix();
  if (vertical) {
    return [getTransformationMatrix(0, base.getHeight()), mat];
  }
  return [mat, getTransformationMatrix(base.getWidth(), 0)];
};

const spread = async (
  path: string,
  vertical: boolean,
  singleTopPage: boolean,
  opposite: boolean,
): Promise<string | null> => {
  const data = await Deno.readFile(path);
  const srcDoc = await PDFDocument.load(data);
  const outDoc = await PDFDocument.create();
  const range = srcDoc.getPageIndices();
  const pages = await outDoc.copyPages(srcDoc, range);

  const rotated = pages.some((page) => {
    const a = page.getRotation().angle;
    return a == 90 || a == 270 || a == -90;
  });

  if (rotated) {
    vertical = !vertical;
  }

  if (singleTopPage) {
    const head = pages.shift();
    if (head) {
      outDoc.addPage(head);
    }
  }

  for (let i = 0; i < pages.length; i += 2) {
    const page = pages[i];
    if (i + 1 == pages.length) {
      outDoc.addPage(page);
      continue;
    }
    const nextPage = pages[i + 1];
    const pair: [PDFPage, PDFPage] = opposite
      ? [nextPage, page]
      : [page, nextPage];

    if (vertical && rotated) {
      pair.unshift(pair.pop()!);
    }

    const dim = getSpreadPageSize(pair, vertical);
    const addedPage = outDoc.addPage(dim);
    addedPage.setRotation(page.getRotation());

    const embedded = await outDoc.embedPages(
      pair,
      getBoundingBoxes(pair),
      toTransformationMatrixes(pair[0], vertical),
    );
    embedded.forEach((emb) => {
      addedPage.drawPage(emb);
    });
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

    if (result === null) {
      console.error("Failed to spread!");
      Deno.exit(1);
    }

    console.log(`Spread: ${result}`);
  });
