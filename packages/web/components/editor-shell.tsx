"use client";
import { Tooltip } from "radix-ui";
import { useState } from "react";
import { AiPanel } from "./ai-panel";
import { CanvasPreview } from "./canvas-preview";
import { CodeView } from "./code-view";
import { Inspector } from "./inspector";
import { LivePreview } from "./live-preview";
import { LayerTree } from "./layer-tree";
import { TopBar, type View } from "./top-bar";

export function EditorShell() {
  const [view, setView] = useState<View>("visual");
  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="grid h-full grid-cols-[240px_1fr_320px] grid-rows-[auto_1fr] text-sm bg-[#F2FBF9] text-[#172A3A] dark:bg-[#080C0E] dark:text-[#F2FBF9] transition-colors">
        <TopBar view={view} onViewChange={setView} />
        <aside aria-label="Layers" className="overflow-auto border-r border-[#DAF5EE] bg-white dark:border-[#004346]/70 dark:bg-[#080C0E] transition-colors">
          <LayerTree />
        </aside>
        <main className="flex min-h-0 flex-col overflow-hidden bg-[#F2FBF9] dark:bg-[#080C0E] transition-colors">
          {view === "visual" ? <CanvasPreview /> : view === "live" ? <LivePreview /> : <CodeView />}
        </main>
        <aside aria-label="Inspector and AI" className="flex min-h-0 flex-col border-l border-[#DAF5EE] bg-white dark:border-[#004346]/70 dark:bg-[#080C0E] transition-colors">
          <div className="min-h-0 flex-1 overflow-auto">
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
    </Tooltip.Provider>
  );
}
