const RECONNECT_MIN_DELAY = 1000;
const RECONNECT_MAX_DELAY = 10000;

const resolveWebSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/eventos/`;
};

export class EventosWebSocketClient {
  constructor(url = resolveWebSocketUrl()) {
    this.url = url;
    this.socket = null;
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.shouldReconnect = false;
    this.messageListeners = new Set();
    this.statusListeners = new Set();
  }

  connect() {
    this.shouldReconnect = true;

    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.clearReconnectTimer();
    this.emitStatus("connecting");
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (this.socket !== socket) return;
      this.reconnectAttempt = 0;
      this.emitStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      if (this.socket !== socket) return;
      try {
        const payload = JSON.parse(event.data);
        this.messageListeners.forEach((listener) => listener(payload));
      } catch {
        this.emitStatus("invalid_message");
      }
    });

    socket.addEventListener("error", () => {
      if (this.socket !== socket) return;
      this.emitStatus("error");
    });

    socket.addEventListener("close", () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.emitStatus("disconnected");
      if (this.shouldReconnect) this.scheduleReconnect();
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectAttempt = 0;
    this.clearReconnectTimer();

    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      socket.close(1000, "Cliente desconectado");
    }

    this.emitStatus("disconnected");
  }

  subscribe(listener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getStatus() {
    if (!this.socket) return "disconnected";
    if (this.socket.readyState === WebSocket.OPEN) return "connected";
    if (this.socket.readyState === WebSocket.CONNECTING) return "connecting";
    return "disconnected";
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      RECONNECT_MIN_DELAY * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_DELAY,
    );
    this.reconnectAttempt += 1;
    this.emitStatus("reconnecting");
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  clearReconnectTimer() {
    if (!this.reconnectTimer) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  emitStatus(status) {
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const eventosWebSocket = new EventosWebSocketClient();
