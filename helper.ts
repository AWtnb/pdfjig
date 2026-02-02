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
  const rangeMatch = token.match(/^(-?\d+)-(-?\d+)$/);

  if (rangeMatch) {
    const start = toInt(rangeMatch[1]);
    const end = toInt(rangeMatch[2]);
    return start !== null && end !== null ? [start, end] : null;
  }

  const n = toInt(token);
  return n === null ? null : [n];
};

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
      const [start, end] = token;
      const arr = [];
      for (
        let i = asPageIndex(start, maxPageCount);
        i <= asPageIndex(end, maxPageCount);
        i++
      ) {
        arr.push(i);
      }
      return arr;
    });
};
