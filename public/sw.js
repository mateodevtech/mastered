self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const isBlocking = data.mode === "blocking";

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: isBlocking ? "Échéance atteinte — action requise" : "Rappel",
      tag: `task-${data.taskId}`,
      // Re-alert on repeat pushes for blocking tasks instead of silently
      // coalescing under the same tag.
      renotify: isBlocking,
      requireInteraction: isBlocking,
      data: { taskId: data.taskId, mode: data.mode },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { taskId, mode } = event.notification.data || {};
  const url = mode === "blocking" ? `/alarm/${taskId}` : `/tasks/${taskId}`;

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
