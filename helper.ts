import { PDFPage } from "pdf-lib";

export type HiddenRotationDegree = 90 | 270;

export const getHiddenRotation = (
  page: PDFPage,
): HiddenRotationDegree | null => {
  const a = page.getRotation().angle;
  if (a == 90 || a == -270) return 90;
  if (a == 270 || a == -90) return 270;
  return null;
};

export const withSuffix = (path: string, suffix: string): string => {
  const parts = path.split(".");
  const extension = parts.pop() || "pdf";
  return parts.join(".") + suffix + "." + extension;
};

export const asPageIndex = (nombre: number, maxPageCount: number): number => {
  if (nombre < 0) {
    return maxPageCount + nombre;
  }
  return nombre - 1;
};

const toInt = (s: string): number | null => {
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
};

const parseToken = (token: string): null | [number] | [number, number] => {
  const startOnlyMatch = token.match(/^(-?\d+)-$/);
  if (startOnlyMatch) {
    const start = toInt(startOnlyMatch[1]);
    return start !== null ? [start, -1] : null;
  }

  const rangeMatch = token.match(/^(-?\d+)-(-?\d+)$/);
  if (rangeMatch) {
    const start = toInt(rangeMatch[1]);
    const end = toInt(rangeMatch[2]);
    return start !== null && end !== null ? [start, end] : null;
  }

  const n = toInt(token);
  return n === null ? null : [n];
};

/**
 * Parse a compact page-range string and return zero-based page indices.
 *
 * Syntax (1-based pages):
 * - `N`      : single page (e.g. "5")
 * - `A-B`    : closed inclusive range (e.g. "1-3")
 * - `A-`     : open-ended range from A to last page (e.g. "7-")
 * - negative : count from the end (e.g. "-1" = last page, "-3--1" = third-last..last)
 * - tokens are comma-separated; whitespace is ignored; invalid tokens are skipped.
 *
 * Parameters:
 * @param pageRange - page-range string to parse
 * @param maxPageCount - total number of pages in the document
 *
 * Returns:
 * An array of zero-based page indices. Indices are returned in the order of tokens/ranges
 * and may include duplicates.
 *
 * Examples (maxPageCount = 10):
 * - asPageIndices("1-3", 10)   => [0, 1, 2]
 * - asPageIndices("5", 10)     => [4]
 * - asPageIndices("7-", 10)    => [6, 7, 8, 9]
 * - asPageIndices("-1", 10)    => [9]
 */
export const asPageIndices = (
  pageRange: string,
  maxPageCount: number,
): number[] => {
  return pageRange
    .split(",")
    .map((s) => s.trim())
    .map(parseToken)
    .filter((token) => token !== null)
    .flatMap((token) => {
      if (token.length == 1) {
        return asPageIndex(token[0], maxPageCount);
      }
      const start = asPageIndex(token[0], maxPageCount);
      const end = asPageIndex(token[1], maxPageCount);
      const arr = [];
      for (let i = start; i <= end; i++) {
        arr.push(i);
      }
      return arr;
    });
};
