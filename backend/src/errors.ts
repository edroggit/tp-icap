import type { ErrorRequestHandler } from 'express';
import type { FieldErrors } from '../../shared/trade.ts';

/** An error whose status and message are sent to the client. */
export class HttpError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Sends errors as JSON `{ error, fieldErrors? }`. Unexpected errors are logged and hidden. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, fieldErrors: err.fieldErrors });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};
