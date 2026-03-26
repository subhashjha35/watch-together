import { buildCorsOriginValidator } from './bootstrap';

describe('buildCorsOriginValidator', () => {
  it('allows exact origin matches', () => {
    const validator = buildCorsOriginValidator('http://localhost:4200');
    const callback = jest.fn();

    validator('http://localhost:4200', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows protocol-only mismatches for the same host', () => {
    const validator = buildCorsOriginValidator('https://localhost:4200');
    const callback = jest.fn();

    validator('http://localhost:4200', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects origins outside the allow list', () => {
    const validator = buildCorsOriginValidator(['https://example.com']);
    const callback = jest.fn();

    validator('https://evil.example', callback);

    expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });
});
