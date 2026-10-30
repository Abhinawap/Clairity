"use client";
import { Tooltip } from "radix-ui";
import { useState } from "react";
import { AiPanel } from "./ai-panel";
import { CanvasPreview } from "./canvas-preview";
import { CodeView } from "./code-view";
import { Inspector } from "./inspector";
import { LayerTree } from "./layer-tree";
import { TopBar, type View } from "./top-bar";

export function EditorShell({ sources = {} }: { sources?: Record<string, string> }) {
  const [view, setView] = useState<View>("visual");
  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="grid h-full grid-cols-[240px_1fr_320px] grid-rows-[auto_1fr] text-sm bg-[#080C0E] text-[#F2FBF9]">
        <TopBar view={view} onViewChange={setView} />
        <aside aria-label="Layers" className="overflow-auto border-r border-[#004346]/70 bg-[#080C0E]">
          <LayerTree />
        </aside>
        <main className="flex min-h-0 flex-col overflow-hidden bg-[#080C0E]">
          {view === "visual" ? <CanvasPreview /> : <CodeView sources={sources} />}
        </main>
        <aside aria-label="Inspector and AI" className="flex min-h-0 flex-col border-l border-[#004346]/70 bg-[#080C0E]">
          <div className="min-h-0 flex-1 overflow-auto">
            <Inspector />
          </div>
          <AiPanel />
        </aside>
      </div>
    </Tooltip.Provider>
  );
}
