import { useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";

import {
  parseDiff,
  pairHunkLines,
  fileStats,
  getLanguage,
  type FileDiff,
  type DiffLine,
} from "../utils/diffParser";
import "./DiffViewer.css";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(content: string, lang: string): string {
  const grammar = Prism.languages[lang];
  if (!content) return "&nbsp;";
  if (!grammar) return escapeHtml(content) || "&nbsp;";
  try {
    return Prism.highlight(content, grammar, lang) || "&nbsp;";
  } catch {
    return escapeHtml(content) || "&nbsp;";
  }
}

function DiffCell({ line, lang }: { line: DiffLine | null; lang: string }) {
  if (!line) {
    return (
      <>
        <td className="dv-lineno dv-empty" />
        <td className="dv-code dv-empty" />
      </>
    );
  }
  const lineNo = line.oldLine ?? line.newLine;
  return (
    <>
      <td className={`dv-lineno dv-${line.type}`}>{lineNo}</td>
      <td
        className={`dv-code dv-${line.type}`}
        dangerouslySetInnerHTML={{ __html: highlight(line.content, lang) }}
      />
    </>
  );
}

function FileSection({ file }: { file: FileDiff }) {
  const [collapsed, setCollapsed] = useState(false);
  const lang = useMemo(() => getLanguage(file.newPath || file.oldPath), [file]);
  const { added, removed } = useMemo(() => fileStats(file), [file]);
  const displayPath = file.newPath || file.oldPath;

  return (
    <div className="dv-file">
      <button
        className="dv-file-header"
        onClick={() => setCollapsed((c) => !c)}
        type="button"
      >
        <svg
          className={`dv-chevron ${collapsed ? "dv-chevron-collapsed" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <code className="dv-file-path">{displayPath}</code>
        <span className="dv-stats">
          <span className="dv-added">+{added}</span>
          <span className="dv-removed">-{removed}</span>
        </span>
      </button>

      {!collapsed && (
        <div className="dv-table-wrap">
          <table className="dv-table">
            <tbody>
              {file.hunks.map((hunk, hIdx) => (
                <>
                  <tr key={`hunk-${hIdx}`} className="dv-hunk-header">
                    <td colSpan={4}>{hunk.header}</td>
                  </tr>
                  {pairHunkLines(hunk.lines).map((row, rIdx) => (
                    <tr key={`row-${hIdx}-${rIdx}`} className="dv-row">
                      <DiffCell line={row.left} lang={lang} />
                      <DiffCell line={row.right} lang={lang} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({ diffText }: { diffText: string }) {
  const files = useMemo(() => parseDiff(diffText), [diffText]);

  if (files.length === 0) {
    return (
      <div className="dv-empty-state">No parseable diff content found.</div>
    );
  }

  return (
    <div className="dv-root">
      {files.map((file, i) => (
        <FileSection key={`${file.newPath}-${i}`} file={file} />
      ))}
    </div>
  );
}