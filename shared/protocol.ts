/**
 * WebSocket message protocol shared by client and server.
 *
 * Every message is a JSON object with a `type` discriminator. To add a new
 * message: add a variant to the relevant union, handle it in the server's
 * `handleMessage` switch and/or the client's `onMessage` handler. TypeScript's
 * exhaustiveness checks will point out any place you missed.
 */

export interface ChatMessage {
  id: number;
  author: string;
  text: string;
  createdAt: string; // ISO-8601, UTC
}

/** Messages sent from the browser to the server. */
export type ClientMessage = { type: 'chat:send'; author: string; text: string };

/** Messages sent from the server to the browser. */
export type ServerMessage =
  | { type: 'chat:history'; messages: ChatMessage[] }
  | { type: 'chat:new'; message: ChatMessage }
  | { type: 'error'; error: string };

/** Validation limits, enforced on the server and mirrored in the UI. */
export const LIMITS = {
  authorMaxLength: 32,
  textMaxLength: 500,
} as const;

/** Path on which the server accepts WebSocket upgrades. */
export const WS_PATH = '/ws';
