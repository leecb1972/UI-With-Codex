import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditorImport from "react-simple-code-editor";
import ReactMarkdown from "react-markdown";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import remarkGfm from "remark-gfm";
import { countWords, createNote, deriveTitle, duplicateNote, filterNotes, notePreview, sortNotes } from "./notes";
import type { ColorDepth, Note } from "./types";
import { resolveDefaultExport } from "./moduleInterop";

const MarkdownEditor = resolveDefaultExport(EditorImport);

const STORAGE_KEY = "paper-notes-v1";
const THEME_KEY = "paper-color-depth";

export const seedNotes: Note[] = [
  { id: "welcome", title: "Welcome to Paper", body: "A quiet place for thoughts.\n\nEverything you write is saved automatically in this app. Create a new note, search your ideas, or simply begin typing.", updatedAt: "2026-07-21T14:42:00.000Z" },
  { id: "ideas", title: "Ideas for the weekend", body: "Visit the farmer’s market early\nBring the film camera\nTry the little bakery on Grove Street", updatedAt: "2026-07-20T16:18:00.000Z" },
  { id: "reading", title: "Reading list", body: "The Creative Act — Rick Rubin\nA Swim in a Pond in the Rain — George Saunders\nWays of Seeing — John Berger", updatedAt: "2026-07-18T09:05:00.000Z" },
];

function loadNotes(): Note[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return Array.isArray(stored) && stored.length ? sortNotes(stored as Note[]) : seedNotes;
  } catch {
    return seedNotes;
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeId, setActiveId] = useState(() => loadNotes()[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [depth, setDepth] = useState<ColorDepth>(() => localStorage.getItem(THEME_KEY) === "deep" ? "deep" : "shallow");
  const titleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeNote = notes.find((note) => note.id === activeId) ?? notes[0];
  const visibleNotes = useMemo(() => filterNotes(sortNotes(notes), query), [notes, query]);

  useEffect(() => {
    document.title = "Tony Notes";
    document.documentElement.dataset.depth = depth;
    document.documentElement.style.colorScheme = depth === "deep" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, depth);
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", depth === "deep" ? "#18251d" : "#edf4eb");
  }, [depth]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const save = useCallback((nextNotes: Note[]) => {
    setNotes(nextNotes);
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
      setSaveState("saved");
    }, 350);
  }, []);

  const addNote = useCallback(() => {
    const note = createNote();
    save([note, ...notes]);
    setActiveId(note.id);
    setQuery("");
    setSidebarOpen(false);
    requestAnimationFrame(() => titleRef.current?.select());
  }, [notes, save]);

  const updateActive = (updates: Pick<Note, "title" | "body">) => {
    if (!activeNote) return;
    save(notes.map((note) => note.id === activeNote.id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note));
  };

  const removeActive = () => {
    if (!activeNote) return;
    let remaining = notes.filter((note) => note.id !== activeNote.id);
    if (!remaining.length) remaining = [createNote()];
    setActiveId(sortNotes(remaining)[0].id);
    save(remaining);
  };

  const copyActive = () => {
    if (!activeNote) return;
    const copy = duplicateNote(activeNote);
    save([copy, ...notes]);
    setActiveId(copy.id);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "n") { event.preventDefault(); addNote(); }
      if (event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [addNote]);

  if (!activeNote) return null;
  const words = countWords(`${activeNote.title} ${activeNote.body}`);

  return (
    <div className={sidebarOpen ? "sidebar-open" : ""}>
      <main className="app-shell">
        <aside className="sidebar" aria-label="Notes list">
          <div className="sidebar-actions">
            <button className="icon-button mobile-close" type="button" aria-label="Close notes" onClick={() => setSidebarOpen(false)}>×</button>
            <div className="app-brand">
              <svg className="app-logo" viewBox="0 0 64 64" role="img" aria-label="Tony Notes logo">
                <rect className="logo-background" width="64" height="64" rx="15" />
                <path className="logo-paper" d="M18 11h20l10 10v32H18z" />
                <path className="logo-fold" d="M38 11v10h10" />
                <path className="logo-fold-line" d="M38 11v10h10" />
                <path className="logo-monogram" d="M24 29c5-3 13-3 18 0M33 27v17m-5 0c4 3 10 2 13-2" />
              </svg>
              <h1>Tony Notes</h1>
            </div>
            <button className="new-note" type="button" onClick={addNote}><span aria-hidden="true">＋</span> New note</button>
            <label className="search-box">
              <span aria-hidden="true">⌕</span><span className="sr-only">Search notes</span>
              <input ref={searchRef} type="search" placeholder="Search notes" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="list-heading"><span>Notes</span><span aria-live="polite">{String(notes.length).padStart(2, "0")}</span></div>
          <div className="notes-list">
            {visibleNotes.length ? visibleNotes.map((note) => (
              <article className={`note-card ${note.id === activeId ? "active" : ""}`} key={note.id} tabIndex={0} role="button" aria-label={`Open ${deriveTitle(note)}`} onClick={() => { setActiveId(note.id); setSidebarOpen(false); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveId(note.id); setSidebarOpen(false); } }}>
                <span className="note-card-top">
                  <input className="note-title-edit" value={note.title} aria-label={`Rename ${deriveTitle(note)}`} onClick={(event) => event.stopPropagation()} onChange={(event) => save(notes.map((item) => item.id === note.id ? { ...item, title: event.target.value, updatedAt: new Date().toISOString() } : item))} />
                  <time>{relativeDate(note.updatedAt)}</time>
                </span>
                <span className="note-preview">{notePreview(note.body)}</span>
              </article>
            )) : <div className="empty-list">No notes found.<br />Try another search.</div>}
          </div>
          <div className="sidebar-footer">
            <button className="theme-toggle" type="button" aria-pressed={depth === "deep"} aria-label={`Switch to ${depth === "deep" ? "shallow" : "deep"} color scheme`} onClick={() => setDepth(depth === "deep" ? "shallow" : "deep")}>
              <span className="theme-toggle-icon" aria-hidden="true" /><span className="theme-toggle-label">{depth === "deep" ? "Deep" : "Shallow"}</span>
            </button>
            <div className="profile-avatar" aria-hidden="true">TL</div>
            <div className="profile-copy"><strong>Tony Li’s workspace</strong><span>Personal</span></div>
            <button className="icon-button" type="button" aria-label="Workspace options">•••</button>
          </div>
        </aside>
        <section className="editor-panel">
          <header className="editor-header">
            <button className="icon-button menu-button" type="button" aria-label="Open notes" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className={`save-state ${saveState}`}><span /> {saveState === "saving" ? "Saving" : "Saved"}</div>
            <div className="editor-actions">
              <div className="mode-switch" role="group" aria-label="Markdown view">
                <button className={`mode-button ${editorMode === "edit" ? "active" : ""}`} type="button" aria-pressed={editorMode === "edit"} onClick={() => setEditorMode("edit")}>Edit</button>
                <button className={`mode-button ${editorMode === "preview" ? "active" : ""}`} type="button" aria-pressed={editorMode === "preview"} onClick={() => setEditorMode("preview")}>Preview</button>
              </div>
              <button className="text-button" type="button" onClick={copyActive}>Duplicate</button>
              <button className="icon-button danger" type="button" aria-label="Delete note" onClick={removeActive}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button>
            </div>
          </header>
          <div className="editor-scroll">
            <article className="editor">
              <div className="date-line">{formatDate(activeNote.updatedAt)}</div>
              <input ref={titleRef} className="title-input" aria-label="Note title" placeholder="Untitled note" value={activeNote.title} onChange={(event) => updateActive({ title: event.target.value, body: activeNote.body })} />
              {editorMode === "edit" ? (
                <>
                  <label className="sr-only" htmlFor="note-content">Note content</label>
                  <MarkdownEditor
                    value={activeNote.body}
                    onValueChange={(body) => updateActive({ title: activeNote.title, body })}
                    highlight={(code) => highlight(code, languages.markdown, "markdown")}
                    padding={0}
                    className="markdown-editor"
                    textareaClassName="markdown-editor-input"
                    textareaId="note-content"
                    placeholder="Start writing…"
                  />
                </>
              ) : (
                <div className="markdown-preview" aria-label="Markdown preview">
                  {activeNote.body.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a> }}
                    >
                      {activeNote.body}
                    </ReactMarkdown>
                  ) : <p className="preview-empty">Nothing to preview yet.</p>}
                </div>
              )}
            </article>
          </div>
          <footer className="status-bar"><span>{words} {words === 1 ? "word" : "words"}</span><span className="shortcut-hint"><kbd>⌘</kbd><kbd>N</kbd> new note</span></footer>
        </section>
      </main>
      <button className="scrim" type="button" aria-label="Close notes" onClick={() => setSidebarOpen(false)} />
    </div>
  );
}
