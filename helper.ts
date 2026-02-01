export const asPageIndex = (nombre: number): number => {
  if (0 < nombre) {
    return nombre - 1;
  }
  return nombre;
};

export const withSuffix = (path: string, suffix: string): string => {
  const parts = path.split(".");
  const extension = parts.pop() || "pdf";
  return parts.join(".") + suffix + "." + extension;
};
