"use client";

import { useEffect } from "react";

const STORAGE_KEY = "mastered:timezone-synced";

// Captures the browser's IANA timezone once per session so deadlines and
// the blocking-alarm schedule compute against the user's real local time.
export function TimezoneSync() {
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone }),
    })
      .then(() => sessionStorage.setItem(STORAGE_KEY, "1"))
      .catch(() => {});
  }, []);

  return null;
}
