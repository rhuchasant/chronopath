import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EvalsPage() {
  let report = "";
  try {
    const p = path.join(process.cwd(), "evals", "report.md");
    report = fs.readFileSync(p, "utf-8");
  } catch {
    report = "# Eval report not yet generated\n\nRun `npm run eval` to generate.";
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <article className="prose-eval">
        <RenderMarkdown md={report} />
      </article>
      <style>{`
        .prose-eval h1 { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; line-height: 1.1; margin-bottom: 0.5rem; }
        .prose-eval h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-eval h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-eval p { margin-bottom: 1rem; line-height: 1.6; }
        .prose-eval em { font-style: italic; color: #6b4423; }
        .prose-eval strong { font-weight: 600; }
        .prose-eval table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin: 1.5rem 0; }
        .prose-eval th, .prose-eval td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(26,22,18,0.1); text-align: left; }
        .prose-eval th { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: #8a7e6a; }
        .prose-eval ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose-eval li { margin-bottom: 0.5rem; line-height: 1.5; }
        .prose-eval code { font-family: 'JetBrains Mono', monospace; background: rgba(26,22,18,0.06); padding: 0.1rem 0.35rem; border-radius: 2px; font-size: 0.9em; }
        .prose-eval pre { background: rgba(26,22,18,0.06); padding: 1rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; overflow-x: auto; margin: 1rem 0; }
      `}</style>
    </main>
  );
}

// Tiny markdown renderer — handles headings, paragraphs, tables, lists, code.
// Avoids pulling react-markdown for this single page.
function RenderMarkdown({ md }: { md: string }) {
  const html = mdToHtml(md);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let inTable = false;
  let inCode = false;
  let inList = false;
  let codeBuf: string[] = [];

  function flushList() {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  }
  function flushTable() {
    if (inTable) {
      html += "</tbody></table>";
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        html += `<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`;
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      flushList(); flushTable();
      html += `<h1>${inline(line.slice(2))}</h1>`;
    } else if (line.startsWith("## ")) {
      flushList(); flushTable();
      html += `<h2>${inline(line.slice(3))}</h2>`;
    } else if (line.startsWith("### ")) {
      flushList(); flushTable();
      html += `<h3>${inline(line.slice(4))}</h3>`;
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushTable();
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
    } else if (line.startsWith("|") && line.includes("|")) {
      flushList();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) continue;
      if (!inTable) {
        html += `<table><thead><tr>${cells.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>`;
        inTable = true;
      } else {
        html += `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`;
      }
    } else if (line.trim() === "") {
      flushList();
      flushTable();
      html += "";
    } else {
      flushList();
      flushTable();
      html += `<p>${inline(line)}</p>`;
    }
  }

  flushList();
  flushTable();
  return html;
}

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}