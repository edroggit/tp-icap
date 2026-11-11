import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '../../../shared/protocol.ts';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting';

const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;

/** Exponential backoff with full jitter: random(0, min(max, base * 2^attempt)). */
const backoff = (attempt: number) =>
  Math.random() * Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);

/**
 * Manages a single WebSocket connection with typed messages and automatic
 * reconnection. The socket is closed cleanly when the component unmounts.
 */
export function useWebSocket(url: string, onMessage: (msg: ServerMessage) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);

  // Keep the latest handler without re-opening the socket when it changes.
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setStatus('open');
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          onMessageRef.current(JSON.parse(event.data) as ServerMessage);
        } catch (err) {
          console.error('[ws] bad message from server', err);
        }
      };

      // `error` is always followed by `close`; reconnection is handled there.
      ws.onerror = () => console.warn('[ws] connection error');

      ws.onclose = (event) => {
        socketRef.current = null;
        if (disposed) return;
        const delay = backoff(attempt++);
        console.info(`[ws] closed (code ${event.code}); reconnecting in ${Math.round(delay)}ms`);
        setStatus('reconnecting');
        retryTimer = setTimeout(connect, delay);
      };
    };

    // Reconnect immediately when the browser comes back online.
    const onOnline = () => {
      if (socketRef.current || disposed) return;
      clearTimeout(retryTimer);
      attempt = 0;
      connect();
    };

    connect();
    window.addEventListener('online', onOnline);

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      window.removeEventListener('online', onOnline);
      socketRef.current?.close(1000, 'Client closed');
      socketRef.current = null;
    };
  }, [url]);

  /** Send a typed message. Returns false if the socket is not open. */
  const send = useCallback((msg: ClientMessage): boolean => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(msg));
    return true;
  }, []);

  return { status, send };
}
