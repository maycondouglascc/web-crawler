import React, { useMemo, useState } from "react";
import { FigmaIcon } from "../ui/icons";
import { STORIES, storiesInGroup, storyById, storyGroups, type StoryId } from "./stories";

export function readDocsStory(): string | null {
  const raw = window.location.hash.replace(/^#/, "");
  const path = raw.startsWith("/") ? raw.slice(1) : raw;
  if (path === "docs") return "overview";
  if (path.startsWith("docs/")) return path.slice("docs/".length) || "overview";
  return null;
}

export function openDocs(id: StoryId = "overview") {
  const next = `#/docs/${id}`;
  if (window.location.hash !== next) window.location.hash = next;
}

export function DesignDocs({ storyId }: { storyId: string }) {
  const [query, setQuery] = useState("");
  const [narrow, setNarrow] = useState(false);
  const story = storyById(storyId);
  const normalized = query.trim().toLowerCase();

  const visibleGroups = useMemo(
    () =>
      storyGroups()
        .map((group) => ({
          group,
          stories: storiesInGroup(group).filter((item) => {
            if (!normalized) return true;
            return item.title.toLowerCase().includes(normalized) || item.summary.toLowerCase().includes(normalized);
          }),
        }))
        .filter((section) => section.stories.length > 0),
    [normalized],
  );

  return (
    <div className="min-h-screen bg-canvas text-white md:flex">
      <aside className="flex w-full shrink-0 flex-col gap-6 bg-sunken px-6 py-6 md:sticky md:top-0 md:h-screen md:w-[280px] md:overflow-y-auto md:py-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-body text-white">Studio</p>
            <p className="text-label text-muted">Design system</p>
          </div>
          <a href="#/" className="inline-flex text-white" aria-label="Back to the studio">
            <FigmaIcon name="back" />
          </a>
        </div>
        <label className="flex h-12 items-center gap-2 rounded-control bg-surface px-4">
          <FigmaIcon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search stories"
            className="w-full bg-transparent text-body text-white placeholder:text-white"
          />
        </label>
        <label className="flex flex-col gap-2 md:hidden">
          <span className="text-label text-subtle">História</span>
          <select
            className="h-12 rounded-control bg-surface px-4 text-body text-white"
            value={story?.id ?? "overview"}
            aria-label="Escolher história"
            onChange={(event) => {
              window.location.hash = `#/docs/${event.target.value}`;
            }}
          >
            {STORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.group} / {item.title}
              </option>
            ))}
          </select>
        </label>
        <nav className="hidden flex-col gap-6 md:flex">
          {visibleGroups.map((section) => (
            <div key={section.group} className="flex flex-col gap-2">
              <p className="text-label text-subtle">{section.group}</p>
              {section.stories.map((item) => {
                const selected = item.id === story?.id;
                return (
                  <a
                    key={item.id}
                    href={`#/docs/${item.id}`}
                    className={`rounded-control px-3 py-2 text-body ${selected ? "bg-surface text-white" : "text-muted"}`}
                    aria-current={selected ? "page" : undefined}
                  >
                    {item.title}
                  </a>
                );
              })}
            </div>
          ))}
          {visibleGroups.length === 0 && <p className="text-body text-muted">Nenhuma história com esse nome.</p>}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-10 px-6 py-10 md:px-10">
        {story ? (
          <>
            <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-4">
                <p className="text-label text-subtle">{story.group}</p>
                <h1 className="text-display font-bold text-white">{story.title}</h1>
                <p className="text-body text-muted">{story.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNarrow(false)}
                  className={`inline-flex h-12 items-center rounded-control px-4 text-body ${narrow ? "border border-line text-white" : "bg-chip text-white"}`}
                >
                  Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setNarrow(true)}
                  className={`inline-flex h-12 items-center rounded-control px-4 text-body ${narrow ? "bg-chip text-white" : "border border-line text-white"}`}
                >
                  Narrow
                </button>
              </div>
            </header>
            <section className={`rounded-card border border-line p-6 md:p-10 ${narrow ? "mx-auto w-full max-w-[390px]" : ""}`}>
              {story.canvas}
            </section>
            {story.docs}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="text-display font-bold text-white">História não encontrada</h1>
            <a href="#/docs/overview" className="text-body text-white">
              Voltar para a visão geral
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
