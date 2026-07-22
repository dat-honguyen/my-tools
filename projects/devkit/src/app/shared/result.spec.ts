import { tryResult } from './result';

describe('tryResult', () => {
  it('wraps a successful call', () => {
    expect(tryResult(() => 42)).toEqual({ ok: true, value: 42 });
  });

  it('wraps a thrown Error', () => {
    expect(
      tryResult(() => {
        throw new Error('boom');
      }),
    ).toEqual({ ok: false, error: 'boom' });
  });

  it('wraps a thrown non-Error', () => {
    expect(
      tryResult(() => {
        throw 'nope';
      }),
    ).toEqual({ ok: false, error: 'Something went wrong.' });
  });
});
