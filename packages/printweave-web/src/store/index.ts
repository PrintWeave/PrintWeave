import { defineStore } from 'pinia'
import {createWebSocketConnection, getPrinterStatuses} from "@/helpers/api.ts";
import type { IPrinter, PrinterStatus } from "@printweave/api-types";
import type {PrinterStatusData} from "@printweave/api-types/dist/responses/printers/get-printer-statuses";

export const usePrinterStore = defineStore('printer', {
  state: () => ({
    websocket: null as WebSocket | null,
    printers: [] as IPrinter[],
    printerStatuses: {} as Record<number, PrinterStatusData>,
  }),

  getters: {
    getPrinters: (state) => state.printers,
    getPrinterStatuses: (state) => state.printerStatuses,
    getPrinterById: (state) => (id: number) => state.printers.find(p => p.id === id),
    getPrinterStatusById: (state) => (id: number) => state.printerStatuses[id],
    isConnected: (state) => state.websocket?.readyState === WebSocket.OPEN,
  },

  actions: {
    async initializeWebSocket() {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.warn('WebSocket is already connected');
        return;
      }

      const token = localStorage.getItem('auth_token') || '';
      this.websocket = await createWebSocketConnection(token.replace("Bearer ", ""));

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'printerListUpdate') {
          this.printers = data.printers;
          console.log('Updated printers:', this.printers);
        } else if (data.type === 'printerStatus') {
          this.printerStatuses[data.data.printerId] = data.data;
          console.log('Updated printer status:', data.printerId, this.printerStatuses[data.printerId]);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },

    getWebSocketUrl() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'ws://localhost:3000';
      return `${baseUrl.replace(/^http/, 'ws')}/ws`;
    },

    sendMessage(message: any) {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(message));
      } else {
        console.error('WebSocket is not connected');
      }
    },

    fetchPrinters() {
      this.sendMessage({ type: 'get', subtype: 'printers' });
    },

    fetchPrinterStatuses() {
      getPrinterStatuses()
    },

    resetState() {
      this.printers = [];
      this.printerStatuses = {};
    }
  }
})
