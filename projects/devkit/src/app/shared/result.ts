export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function tryResult<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}
