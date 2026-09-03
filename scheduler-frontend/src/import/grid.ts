const BOM = "\uFEFF";
const NON_BREAKING_SPACE = /\u00A0/g;

export type Grid = string[][];

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/).find((line) => line.trim() !== "");
  if (!firstLine) return "\t";
  if (firstLine.includes("\t")) return "\t";
  if (!firstLine.includes(",") && firstLine.includes(";")) return ";";
  return ",";
}

function cleanCell(value: string): string {
  return value.replace(NON_BREAKING_SPACE, " ").trim();
}

export function parseGrid(text: string, delimiter = detectDelimiter(text)): Grid {
  const source = text.startsWith(BOM) ? text.slice(1) : text;

  const rows: Grid = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inQuotes) {
      if (char !== '"') {
        field += char;
      } else if (source[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);

  return rows.map((cells) => cells.map(cleanCell));
}

export function isBlankRow(cells: string[]): boolean {
  return cells.every((cell) => cell === "");
}
