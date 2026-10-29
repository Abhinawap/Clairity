"use client";
import type { IRNode } from "parser";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { useStore } from "zustand";
import { fakeExtension } from "./fake-extension";
import { realExtension } from "./real-extension";
import { createSession, type SessionState } from "./session";

const SessionContext = createContext<ReturnType<typeof createSession> | null>(null);

// Creates the session for every component under it. Fake or real is chosen here: a sessionId in the
// URL means a real extension is out there to pair with over the broker; without one, the fake runs.
// The link is kept alongside the session (not just inside it) so it can be closed on unmount — a
// reload or a React Strict Mode dev remount would otherwise leave an orphaned open WebSocket behind.
export function SessionProvider({ sessionId, fixture, children }: { sessionId?: string; fixture: IRNode[]; children: ReactNode }) {
  const [{ session, link }] = useState(() => {
    const link = sessionId ? realExtension(sessionId).link : fakeExtension(fixture).link;
    return { session: createSession(link), link };
  });
  useEffect(() => () => link.close?.(), [link]);
  return <SessionContext value={session}>{children}</SessionContext>;
}

// Reads state or an action from the session, e.g. useSession(selectedNode) or useSession((s) => s.applyEdit).
export function useSession<T>(selector: (state: SessionState) => T): T {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession must be used inside a SessionProvider");
  return useStore(session, selector);
}
