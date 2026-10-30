"use client";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { useStore } from "zustand";
import { type Fixture, fakeExtension } from "./fake-extension";
import { realExtension } from "./real-extension";
import { connectSession, createSessionStore, type SessionState } from "./session";

const SessionContext = createContext<ReturnType<typeof createSessionStore> | null>(null);

// Creates the session for every component under it. Fake or real is chosen here, from the session ID alone:
// the extension opens the web app at /editor?session=<id>, which connects to the broker; without one, the fake runs.
//
// The store is built in useState's lazy initializer, which has no side effect, and the link opens in an effect, so
// React Strict Mode's dev remount closes the socket it opened instead of leaking it.
export function SessionProvider({ sessionId, fixture, children }: { sessionId?: string; fixture: Fixture; children: ReactNode }) {
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
