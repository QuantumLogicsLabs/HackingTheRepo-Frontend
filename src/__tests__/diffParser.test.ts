import { describe, it, expect } from "vitest";
import { parseDiff, pairHunkLines, fileStats, getLanguage } from "../utils/diffParser";

describe("parseDiff", () => {
  it("parses a single-file unified diff into structured hunks", () => {
    const sample = `diff --git a/foo.txt b/foo.txt
--- a/foo.txt
+++ b/foo.txt
@@ -1,2 +1,2 @@
-old line
+new line
 unchanged line`;

    const result = parseDiff(sample);
    expect(result).toHaveLength(1);
    expect(result[0].newPath).toBe("foo.txt");
    expect(result[0].hunks).toHaveLength(1);
    expect(result[0].hunks[0].lines).toHaveLength(3);
  });

  it("returns an empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
  });

  it("returns an empty array for non-diff text", () => {
    expect(parseDiff("just some random text")).toEqual([]);
  });
});

describe("pairHunkLines", () => {
  it("pairs adjacent remove/add lines for side-by-side display", () => {
    const sample = `diff --git a/foo.txt b/foo.txt
--- a/foo.txt
+++ b/foo.txt
@@ -1,1 +1,1 @@
-old line
+new line`;

    const files = parseDiff(sample);
    const rows = pairHunkLines(files[0].hunks[0].lines);
    expect(rows).toHaveLength(1);
    expect(rows[0].left?.type).toBe("remove");
    expect(rows[0].right?.type).toBe("add");
  });
});

describe("fileStats", () => {
  it("counts added and removed lines correctly", () => {
    const sample = `diff --git a/foo.txt b/foo.txt
--- a/foo.txt
+++ b/foo.txt
@@ -1,2 +1,2 @@
-removed line
+added line 1
+added line 2`;

    const files = parseDiff(sample);
    const stats = fileStats(files[0]);
    expect(stats.removed).toBe(1);
    expect(stats.added).toBe(2);
  });
});

describe("getLanguage", () => {
  it("maps common extensions to Prism language names", () => {
    expect(getLanguage("src/App.tsx")).toBe("tsx");
    expect(getLanguage("index.css")).toBe("css");
    expect(getLanguage("README.md")).toBe("markdown");
  });

  it("falls back to markup for unknown extensions", () => {
    expect(getLanguage("file.unknownext")).toBe("markup");
  });
});