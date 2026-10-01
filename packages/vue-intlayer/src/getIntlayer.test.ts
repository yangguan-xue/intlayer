import { getIntlayer as getIntlayerCore } from '@intlayer/core/interpreter';
import { getDictionaries } from '@intlayer/dictionaries-entry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMissingKeys, getMissingKeys } from './devtools/missingKeys';
import { getIntlayer } from './getIntlayer';

vi.mock('@intlayer/core/interpreter', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getIntlayer: vi.fn(),
}));

vi.mock('@intlayer/dictionaries-entry', () => ({
  getDictionaries: vi.fn(),
}));

const getIntlayerCoreMock = vi.mocked(getIntlayerCore);
const getDictionariesMock = vi.mocked(getDictionaries);

describe('getIntlayer missing key reporting', () => {
  beforeEach(() => {
    clearMissingKeys();
    vi.stubEnv('NODE_ENV', 'development');
    getIntlayerCoreMock.mockReturnValue({} as never);
    getDictionariesMock.mockReturnValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports keys without a loaded dictionary', () => {
    getIntlayer('unknown-dictionary' as never);

    expect(getMissingKeys().map((record) => record.key)).toEqual([
      'unknown-dictionary',
    ]);
  });

  it('does not report loaded dictionaries', () => {
    getDictionariesMock.mockReturnValue({ 'my-dictionary': {} } as never);

    getIntlayer('my-dictionary' as never);

    expect(getMissingKeys()).toEqual([]);
  });

  it('does not report outside development', () => {
    vi.stubEnv('NODE_ENV', 'production');

    getIntlayer('unknown-dictionary' as never);

    expect(getMissingKeys()).toEqual([]);
  });

  it('does not report when the devtools are disabled', () => {
    vi.stubEnv('INTLAYER_DEVTOOLS_ENABLED', 'false');

    getIntlayer('unknown-dictionary' as never);

    expect(getMissingKeys()).toEqual([]);
  });

  it('still delegates to the core getIntlayer', () => {
    getIntlayer('unknown-dictionary' as never);

    expect(getIntlayerCoreMock).toHaveBeenCalledTimes(1);
  });
});
