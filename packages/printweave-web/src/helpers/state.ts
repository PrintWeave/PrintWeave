import { usePrinterStore } from "@/store";

// Compatibility functions for existing code to transition to using Pinia
export function getWebSocketConnection() {
  const store = usePrinterStore();
  if (!store.websocket) {
    store.initializeWebSocket();
  }
  return store.websocket;
}

export function getWebSocketUrl() {
  const store = usePrinterStore();
  return store.getWebSocketUrl();
}

// Initialize the WebSocket connection when this file is imported
// This ensures backward compatibility for existing code
(() => {
  getWebSocketConnection();
})();

