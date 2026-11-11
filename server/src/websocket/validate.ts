import { LIMITS, type ClientMessage } from '../../../shared/protocol.ts';

export type ParseResult = { ok: true; message: ClientMessage } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse and validate an untrusted frame from a client. */
export function parseClientMessage(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Message is not valid JSON' };
  }
  if (!isRecord(data) || typeof data.type !== 'string') {
    return { ok: false, error: 'Message must be an object with a "type" field' };
  }

  switch (data.type) {
    case 'chat:send': {
      const { author, text } = data;
      if (typeof author !== 'string' || typeof text !== 'string') {
        return { ok: false, error: '"author" and "text" must be strings' };
      }
      const a = author.trim();
      const t = text.trim();
      if (!a || a.length > LIMITS.authorMaxLength) {
        return { ok: false, error: `Name must be 1-${LIMITS.authorMaxLength} characters` };
      }
      if (!t || t.length > LIMITS.textMaxLength) {
        return { ok: false, error: `Message must be 1-${LIMITS.textMaxLength} characters` };
      }
      return { ok: true, message: { type: 'chat:send', author: a, text: t } };
    }
    default:
      return { ok: false, error: `Unknown message type "${data.type}"` };
  }
}
