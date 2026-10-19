"use client";
import type { IRNode } from "parser";
import { useState } from "react";
import { useStore } from "zustand";
import { fakeExtension } from "../data/fake-extension";
import { createSession } from "../data/session";

// Bare check that the store holds the scene graph; components belong to the frontend partner.
export function SceneGraphDump({ roots }: { roots: IRNode[] }) {
  const [session] = useState(() => createSession(fakeExtension(roots).link));
  return <pre>{JSON.stringify(useStore(session), null, 2)}</pre>;
}
