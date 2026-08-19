import "./css/style.css";

import { App } from "./app";

async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "./service-worker.js",
    );

    console.log("Service Worker registered:", registration.scope);
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

void registerServiceWorker();

App.start();
