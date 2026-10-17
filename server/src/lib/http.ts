import type { NextFunction, Request, Response } from 'express'

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const badRequest = (code: string, message: string, details?: unknown) => new HttpError(400, code, message, details)
export const notFound = (message = 'Not found') => new HttpError(404, 'NOT_FOUND', message)
export const conflict = (code: string, message: string, details?: unknown) => new HttpError(409, code, message, details)

type Handler = (req: Request<Record<string, string>>, res: Response) => unknown | Promise<unknown>

/** Wrap a handler: the returned value is sent as JSON, thrown HttpErrors become error responses. */
export const route =
  (fn: Handler, status = 200) =>
  async (req: Request<Record<string, string>>, res: Response, next: NextFunction) => {
    try {
      const out = await fn(req, res)
      if (res.headersSent) return
      // A handler may pick its own status (e.g. 200 for an idempotent replay); otherwise use the route default.
      if (res.statusCode === 200) res.status(status)
      res.json(out)
    } catch (err) {
      next(err)
    }
  }

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } })
    return
  }
  // express.json() rejects bad bodies with a client-error status; report those as 4xx, not a server crash.
  const type = (err as { type?: string } | null)?.type
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } })
    return
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'The request body is too large.' } })
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' } })
}
