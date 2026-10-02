"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// Reads a browser-only value (navigator, window, Notification...) without
// the classic "useState(false) + useEffect(() => setState(true))" dance —
// that pattern triggers react-hooks/set-state-in-effect under the newer
// React Compiler lint rules. useSyncExternalStore gives the server a safe
// fallback and the client the real value on the very first render, with
// no extra re-render in between.
export function useClientValue<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getClientValue, () => serverValue);
}
