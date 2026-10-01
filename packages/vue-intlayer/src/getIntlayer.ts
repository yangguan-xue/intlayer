import { getIntlayer as getIntlayerCore } from '@intlayer/core/interpreter';
import { getDictionaries } from '@intlayer/dictionaries-entry';
import type {
  DeclaredLocales,
  DictionaryKeys,
  DictionaryRegistryResult,
  DictionarySelectorForKey,
  ExtractSelectorLocale,
  LocalesValues,
} from '@intlayer/types/module_augmentation';
import { reportMissingKey } from './devtools/missingKeys';
import { type DeepTransformContent, getPlugins } from './plugins';

/**
 * Picks one dictionary by its key and returns its content for the given
 * locale or selector (`{ item }`, `{ variant }`,
 * optionally combined with `locale`).
 */
export const getIntlayer = <
  const T extends DictionaryKeys,
  const A extends LocalesValues | DictionarySelectorForKey<T> = DeclaredLocales,
>(
  key: T,
  localeOrSelector?: A
): DeepTransformContent<
  DictionaryRegistryResult<T, A>,
  ExtractSelectorLocale<A>
> => {
  const locale = (
    typeof localeOrSelector === 'object' && localeOrSelector !== null
      ? localeOrSelector.locale
      : localeOrSelector
  ) as LocalesValues | undefined;

  // Surface missing keys to the devtools "Missing keys" group (development
  // only — the core logs its own warning regardless of the devtools).
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.INTLAYER_DEVTOOLS_ENABLED !== 'false' &&
    typeof window !== 'undefined' &&
    !getDictionaries()[key as string]
  ) {
    reportMissingKey(key as string);
  }

  return getIntlayerCore(key, localeOrSelector, getPlugins(locale)) as any;
};
