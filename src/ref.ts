export const refLabel = (bookName: string, chapter: number, v1?: number, v2?: number) => {
  if (v1 === undefined) return `${bookName} ${chapter}`;
  return v2 !== undefined && v2 !== v1 ? `${bookName} ${chapter}:${v1}-${v2}` : `${bookName} ${chapter}:${v1}`;
};
