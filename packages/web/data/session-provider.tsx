"use client";
import { createContext, type ReactNode, use, useState } from "react";
import { useStore } from "zustand";
import { type Fixture, fakeExtension } from "./fake-extension";
import { createSession, type SessionState } from "./session";

const SessionContext = createContext<ReturnType<typeof createSession> | null>(null);

// Creates the session for every component under it. Fake or real is chosen here: until the broker connection exists, only the fake runs.
export function SessionProvider({ fixture, children }: { fixture: Fixture; children: ReactNode }) {
  const [session] = useState(() => createSession(fakeExtension(fixture).link));
  return <SessionContext value={session}>{children}</SessionContext>;
}

// Reads state or an action from the session, e.g. useSession(selectedNode) or useSession((s) => s.applyEdit).
export function useSession<T>(selector: (state: SessionState) => T): T {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession must be used inside a SessionProvider");
  return useStore(session, selector);
}
