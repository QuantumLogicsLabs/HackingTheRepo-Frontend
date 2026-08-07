export type DiffLine = {
  type: "add" | "remove" | "normal";
  content: string;
  oldLine: number | null;
  newLine: number | null;
};

export type Hunk = {
  header: string;
  lines: DiffLine[];
};

export type FileDiff = {
  oldPath: string;
  newPath: string;
  hunks: Hunk[];
};

export type PairedRow = {
  left: DiffLine | null;
  right: DiffLine | null;
};

/** Parses a unified diff (`git diff` / patch) string into structured files. */
export function parseDiff(diffText: string): FileDiff[] {
  const files: FileDiff[] = [];
  const lines = diffText.split("\n");

  let currentFile: FileDiff | null = null;
  let currentHunk: Hunk | null = null;
  let oldLineNo = 0;
  let newLineNo = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      if (currentFile) files.push(currentFile);
      currentFile = { oldPath: "", newPath: "", hunks: [] };
      currentHunk = null;
      continue;
    }
    if (line.startsWith("--- ")) {
      if (currentFile) currentFile.oldPath = line.slice(4).replace(/^a\//, "");
      continue;
    }
    if (line.startsWith("+++ ")) {
      if (currentFile) currentFile.newPath = line.slice(4).replace(/^b\//, "");
      continue;
    }
    if (line.startsWith("@@")) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match && currentFile) {
        oldLineNo = parseInt(match[1], 10);
        newLineNo = parseInt(match[2], 10);
        currentHunk = { header: line, lines: [] };
        currentFile.hunks.push(currentHunk);
      }
      continue;
    }
    if (!currentHunk) continue;
    if (line.startsWith("\\")) continue; // "\ No newline at end of file"

    if (line.startsWith("+")) {
      currentHunk.lines.push({
        type: "add",
        content: line.slice(1),
        oldLine: null,
        newLine: newLineNo++,
      });
    } else if (line.startsWith("-")) {
      currentHunk.lines.push({
        type: "remove",
        content: line.slice(1),
        oldLine: oldLineNo++,
        newLine: null,
      });
    } else {
      currentHunk.lines.push({
        type: "normal",
        content: line.slice(1),
        oldLine: oldLineNo++,
        newLine: newLineNo++,
      });
    }
  }
  if (currentFile) files.push(currentFile);
  return files;
}

/** Groups raw diff lines into left/right pairs for a side-by-side view. */
export function pairHunkLines(lines: DiffLine[]): PairedRow[] {
  const rows: PairedRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "normal") {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    const removes: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "remove") {
      removes.push(lines[i]);
      i++;
    }
    const adds: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "add") {
      adds.push(lines[i]);
      i++;
    }

    const max = Math.max(removes.length, adds.length);
    for (let j = 0; j < max; j++) {
      rows.push({ left: removes[j] ?? null, right: adds[j] ?? null });
    }
  }

  return rows;
}

export function fileStats(file: FileDiff): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.type === "add") added++;
      if (line.type === "remove") removed++;
    }
  }
  return { added, removed };
}

const EXT_LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  html: "markup",
  md: "markdown",
  py: "python",
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  rb: "ruby",
};

export function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG_MAP[ext] || "markup";
}