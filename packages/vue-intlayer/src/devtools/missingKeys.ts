import type { CustomInspectorNode } from '@vue/devtools-api';

/**
 * Runtime record of a translation key requested through `getIntlayer` while
 * no dictionary with that key was loaded.
 */
export type MissingKeyRecord = {
  key: string;
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
};

const missingKeyRecords = new Map<string, MissingKeyRecord>();
const listeners = new Set<() => void>();

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

/**
 * Record a request for a key that has no loaded dictionary. Only the first
 * occurrence of a key notifies the listeners (the devtools tree lists one
 * node per key); later hits just bump the counters.
 */
export const reportMissingKey = (key: string): void => {
  const now = Date.now();
  const record = missingKeyRecords.get(key);

  if (record) {
    record.count += 1;
    record.lastSeenAt = now;
    return;
  }

  missingKeyRecords.set(key, {
    key,
    count: 1,
    firstSeenAt: now,
    lastSeenAt: now,
  });
  notifyListeners();
};

/**
 * List the recorded missing keys, oldest first.
 */
export const getMissingKeys = (): MissingKeyRecord[] =>
  [...missingKeyRecords.values()].sort(
    (first, second) => first.firstSeenAt - second.firstSeenAt
  );

/**
 * Forget all recorded missing keys and notify the listeners.
 */
export const clearMissingKeys = (): void => {
  if (missingKeyRecords.size === 0) return;

  missingKeyRecords.clear();
  notifyListeners();
};

/**
 * Subscribe to registry changes (a new key reported, or the registry
 * cleared). Returns an unsubscribe function.
 */
export const onMissingKeysChange = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const MISSING_KEYS_GROUP_NODE_ID = 'intlayer-missing-keys';
export const MISSING_KEY_NODE_ID_PREFIX = 'missing-key:';

export const isMissingKeyNodeId = (nodeId: string): boolean =>
  nodeId.startsWith(MISSING_KEY_NODE_ID_PREFIX);

export const getKeyFromMissingKeyNodeId = (nodeId: string): string =>
  nodeId.slice(MISSING_KEY_NODE_ID_PREFIX.length);

/**
 * Build the "Missing keys" group node of the devtools inspector: one child
 * node per missing key, the group carrying a red tag with the count.
 */
export const buildMissingKeysGroupNode = (
  records: MissingKeyRecord[]
): CustomInspectorNode => ({
  id: MISSING_KEYS_GROUP_NODE_ID,
  label: 'Missing keys',
  children: records.map((record) => ({
    id: `${MISSING_KEY_NODE_ID_PREFIX}${record.key}`,
    label: record.key,
  })),
  tags: [
    {
      label: String(records.length),
      textColor: 0xffffff,
      backgroundColor: 0xd32f2f,
    },
  ],
});
