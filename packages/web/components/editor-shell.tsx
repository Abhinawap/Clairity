"use client";
import { Tooltip } from "radix-ui";
import { useState } from "react";
import { AiPanel } from "./ai-panel";
import { CanvasPreview } from "./canvas-preview";
import { CodeView } from "./code-view";
import { Inspector } from "./inspector";
import { LayerTree } from "./layer-tree";
import { TopBar, type View } from "./top-bar";

export function EditorShell() {
  const [view, setView] = useState<View>("visual");
  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="grid h-full grid-cols-[240px_1fr_320px] grid-rows-[auto_1fr] text-sm">
        <TopBar view={view} onViewChange={setView} />
        <aside aria-label="Layers" className="overflow-auto border-r border-zinc-200 dark:border-zinc-800">
          <LayerTree />
        </aside>
        <main className="flex min-h-0 flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          {view === "visual" ? <CanvasPreview /> : <CodeView />}
        </main>
        <aside aria-label="Inspector and AI" className="flex min-h-0 flex-col border-l border-zinc-200 dark:border-zinc-800">
          <div className="min-h-0 flex-1 overflow-auto">
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
    </Tooltip.Provider>
  );
}
