"use client";
import type { IRNode } from "parser";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { useStore } from "zustand";
import { fakeExtension } from "./fake-extension";
import { realExtension } from "./real-extension";
import { connectSession, createSessionStore, type SessionState } from "./session";

const SessionContext = createContext<ReturnType<typeof createSessionStore> | null>(null);

// Creates the session for every component under it. Fake or real is chosen here: a sessionId in the
// URL means a real extension is out there to pair with over the broker; without one, the fake runs.
//
// Store creation (useState's lazy initializer) and opening the connection (useEffect) are kept
// deliberately separate: React Strict Mode invokes a lazy initializer twice in dev and discards one
// result, but building a store has no side effect to leak. Opening a real WebSocket does, so that
// happens in the effect instead, where Strict Mode's setup->cleanup->setup dev check closes
// whatever it opens rather than leaking it.
export function SessionProvider({ sessionId, fixture, children }: { sessionId?: string; fixture: IRNode[]; children: ReactNode }) {
  const [{ session, link }] = useState(() => {
    const link = sessionId ? realExtension(sessionId).link : fakeExtension(fixture).link;
    return { session: createSessionStore(link), link };
  });
  useEffect(() => {
    connectSession(session, link);
    return () => link.close?.();
  }, [session, link]);
  return <SessionContext value={session}>{children}</SessionContext>;
}

// Reads state or an action from the session, e.g. useSession(selectedNode) or useSession((s) => s.applyEdit).
export function useSession<T>(selector: (state: SessionState) => T): T {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession must be used inside a SessionProvider");
  return useStore(session, selector);
}
