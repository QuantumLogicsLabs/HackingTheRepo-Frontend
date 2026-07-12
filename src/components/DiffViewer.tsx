"use client";

import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface DiffViewerProps {
  diffText: string;
  splitView?: boolean;
}

interface ParsedFile {
  oldFileName: string;
  newFileName: string;
  oldStr: string;
  newStr: string;
}

function parseUnifiedDiff(diff: string): ParsedFile[] {
  const lines = diff.split("\n");
  const files: ParsedFile[] = [];
  let current: ParsedFile | null = null;

  for (const line of lines) {
    if (line.startsWith("--- ")) {
      if (current) files.push(current);
      current = {
        oldFileName: line.slice(4).trim(),
        newFileName: "",
        oldStr: "",
        newStr: "",
      };
    } else if (line.startsWith("+++ ") && current) {
      current.newFileName = line.slice(4).trim();
    } else if (line.startsWith("@@ ")) {
      // skip the @@ hunk header
    } else if (current) {
      if (line.startsWith("+")) {
        current.newStr += line.slice(1) + "\n";
      } else if (line.startsWith("-")) {
        current.oldStr += line.slice(1) + "\n";
      } else if (line.startsWith(" ")) {
        // context line — belongs to both
        const content = line.slice(1);
        current.oldStr += content + "\n";
        current.newStr += content + "\n";
      } else if (line.startsWith("diff ") || line.startsWith("index ")) {
        // new file header, skip
      } else if (line.startsWith("old mode") || line.startsWith("new mode")) {
        // skip mode lines
      } else if (line.startsWith("Binary files")) {
        // skip binary files
      } else if (line === "") {
        // empty line in unified diff context
        current.oldStr += "\n";
        current.newStr += "\n";
      }
    }
  }
  if (current) files.push(current);
  return files;
}

export default function DiffViewer({
  diffText,
  splitView = true,
}: DiffViewerProps) {
  const { theme } = useTheme();
  const [viewType, setViewType] = useState<"split" | "unified">(
    splitView ? "split" : "unified"
  );

  const files = useMemo(() => {
    if (!diffText) return [];
    return parseUnifiedDiff(diffText);
  }, [diffText]);

  const customStyles = {
    variables: {
      light: {
        diffViewerBackground: "var(--bg2)",
        diffViewerColor: "var(--text2)",
        addedBackground: "rgba(34, 197, 94, 0.08)",
        addedColor: "#22c55e",
        removedBackground: "rgba(239, 68, 68, 0.08)",
        removedColor: "#ef4444",
        wordAddedBackground: "rgba(34, 197, 94, 0.2)",
        wordRemovedBackground: "rgba(239, 68, 68, 0.2)",
        addedGutterBackground: "rgba(34, 197, 94, 0.06)",
        removedGutterBackground: "rgba(239, 68, 68, 0.06)",
        gutterBackground: "var(--bg3)",
        gutterBackgroundDark: "var(--bg4)",
        highlightBackground: "rgba(79, 124, 255, 0.1)",
        highlightGutterBackground: "rgba(79, 124, 255, 0.1)",
        codeFoldGutterBackground: "var(--bg3)",
        codeFoldBackground: "var(--bg2)",
        emptyLineBackground: "var(--bg2)",
        gutterColor: "var(--text3)",
        addedGutterColor: "#22c55e",
        removedGutterColor: "#ef4444",
        codeFoldContentColor: "var(--text3)",
        diffViewerTitleBackground: "var(--bg3)",
        diffViewerTitleColor: "var(--text2)",
        diffViewerTitleBorderColor: "var(--border)",
      },
      dark: {
        diffViewerBackground: "var(--bg2)",
        diffViewerColor: "var(--text2)",
        addedBackground: "rgba(34, 197, 94, 0.1)",
        addedColor: "#22c55e",
        removedBackground: "rgba(239, 68, 68, 0.1)",
        removedColor: "#ef4444",
        wordAddedBackground: "rgba(34, 197, 94, 0.25)",
        wordRemovedBackground: "rgba(239, 68, 68, 0.25)",
        addedGutterBackground: "rgba(34, 197, 94, 0.08)",
        removedGutterBackground: "rgba(239, 68, 68, 0.08)",
        gutterBackground: "var(--bg3)",
        gutterBackgroundDark: "var(--bg4)",
        highlightBackground: "rgba(0, 212, 255, 0.1)",
        highlightGutterBackground: "rgba(0, 212, 255, 0.1)",
        codeFoldGutterBackground: "var(--bg3)",
        codeFoldBackground: "var(--bg2)",
        emptyLineBackground: "var(--bg2)",
        gutterColor: "var(--text3)",
        addedGutterColor: "#22c55e",
        removedGutterColor: "#ef4444",
        codeFoldContentColor: "var(--text3)",
        diffViewerTitleBackground: "var(--bg3)",
        diffViewerTitleColor: "var(--text2)",
        diffViewerTitleBorderColor: "var(--border)",
      },
    },
    line: {
      fontSize: "12px",
      fontFamily: "var(--font-mono)",
    },
    gutter: {
      fontSize: "11px",
      fontFamily: "var(--font-mono)",
    },
    codeFoldContent: {
      fontSize: "12px",
      fontFamily: "var(--font-mono)",
    },
    content: {
      fontSize: "12px",
      fontFamily: "var(--font-mono)",
    },
  };

  if (!diffText || files.length === 0) {
    return (
      <div className="diff-viewer-wrapper">
        <pre className="diff-plain-fallback">{diffText || "No diff available."}</pre>
      </div>
    );
  }

  return (
    <div className="diff-viewer-wrapper">
      <div className="diff-viewer-toggle">
        <button
          className={`diff-toggle-btn${viewType === "split" ? " active" : ""}`}
          onClick={() => setViewType("split")}
        >
          Split
        </button>
        <button
          className={`diff-toggle-btn${viewType === "unified" ? " active" : ""}`}
          onClick={() => setViewType("unified")}
        >
          Unified
        </button>
      </div>
      <div className="diff-viewer-container">
        {files.map((file, i) => (
          <div key={i} className="diff-file-section">
            {files.length > 1 && (
              <div className="diff-file-header">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--text3)", flexShrink: 0 }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{file.newFileName || file.oldFileName || `File ${i + 1}`}</span>
              </div>
            )}
            <ReactDiffViewer
              oldValue={file.oldStr}
              newValue={file.newStr}
              splitView={viewType === "split"}
              useDarkTheme={theme === "dark"}
              styles={customStyles}
              compareMethod={DiffMethod.WORDS}
              leftTitle="Original"
              rightTitle="Modified"
              disableWorker
            />
          </div>
        ))}
      </div>
    </div>
  );
}
