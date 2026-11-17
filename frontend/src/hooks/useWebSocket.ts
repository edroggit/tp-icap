import { useEffect, useRef } from 'react';
import type { ServerMessage } from '../../../shared/trade.ts';

const URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;

/** Subscribe to server pushes, reconnecting after 2 seconds if the connection drops. */
export function useWebSocket(onMessage: (msg: ServerMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(URL);
      socket.onmessage = (event) => onMessageRef.current(JSON.parse(event.data) as ServerMessage);
      socket.onclose = () => {
        if (!closed) retryTimer = setTimeout(connect, 2000);
      };
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      socket.close();
    };
  }, []);
}
