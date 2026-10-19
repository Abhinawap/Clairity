"use client";
import { useSession } from "../data/session-provider";

// Bare check that the store holds the scene graph; components belong to the frontend partner.
export function SceneGraphDump() {
  return <pre>{JSON.stringify(useSession((s) => s), null, 2)}</pre>;
}
