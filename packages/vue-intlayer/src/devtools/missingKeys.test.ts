import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMissingKeysGroupNode,
  clearMissingKeys,
  getKeyFromMissingKeyNodeId,
  getMissingKeys,
  isMissingKeyNodeId,
  MISSING_KEY_NODE_ID_PREFIX,
  MISSING_KEYS_GROUP_NODE_ID,
  onMissingKeysChange,
  reportMissingKey,
} from './missingKeys';

describe('missing keys registry', () => {
  beforeEach(() => {
    clearMissingKeys();
  });

  it('records a missing key with its counters', () => {
    reportMissingKey('unknown-dictionary');

    const records = getMissingKeys();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ key: 'unknown-dictionary', count: 1 });
    expect(records[0]?.firstSeenAt).toBe(records[0]?.lastSeenAt);
  });

  it('bumps the counters on repeated reports without duplicating the key', () => {
    reportMissingKey('unknown-dictionary');
    reportMissingKey('unknown-dictionary');
    reportMissingKey('unknown-dictionary');

    const records = getMissingKeys();

    expect(records).toHaveLength(1);
    expect(records[0]?.count).toBe(3);
    expect(records[0]?.lastSeenAt).toBeGreaterThanOrEqual(
      records[0]?.firstSeenAt ?? 0
    );
  });

  it('lists the keys oldest first', () => {
    reportMissingKey('first-key');
    reportMissingKey('second-key');

    expect(getMissingKeys().map((record) => record.key)).toEqual([
      'first-key',
      'second-key',
    ]);
  });

  it('notifies the listeners only for new keys', () => {
    const listener = vi.fn();
    onMissingKeysChange(listener);

    reportMissingKey('unknown-dictionary');
    reportMissingKey('unknown-dictionary');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies the listeners when cleared', () => {
    const listener = vi.fn();
    onMissingKeysChange(listener);
    reportMissingKey('unknown-dictionary');
    listener.mockClear();

    clearMissingKeys();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getMissingKeys()).toEqual([]);
  });

  it('does not notify when clearing an empty registry', () => {
    const listener = vi.fn();
    onMissingKeysChange(listener);

    clearMissingKeys();

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onMissingKeysChange(listener);

    unsubscribe();
    reportMissingKey('unknown-dictionary');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('missing keys devtools nodes', () => {
  beforeEach(() => {
    clearMissingKeys();
  });

  it('parses missing key node ids', () => {
    expect(isMissingKeyNodeId(`${MISSING_KEY_NODE_ID_PREFIX}my-key`)).toBe(
      true
    );
    expect(isMissingKeyNodeId(MISSING_KEYS_GROUP_NODE_ID)).toBe(false);
    expect(isMissingKeyNodeId('locale:fr')).toBe(false);
    expect(
      getKeyFromMissingKeyNodeId(`${MISSING_KEY_NODE_ID_PREFIX}my-key`)
    ).toBe('my-key');
  });

  it('builds a group node with one child per missing key and a count tag', () => {
    reportMissingKey('first-key');
    reportMissingKey('second-key');

    const groupNode = buildMissingKeysGroupNode(getMissingKeys());

    expect(groupNode.id).toBe(MISSING_KEYS_GROUP_NODE_ID);
    expect(groupNode.children?.map((child) => child.id)).toEqual([
      `${MISSING_KEY_NODE_ID_PREFIX}first-key`,
      `${MISSING_KEY_NODE_ID_PREFIX}second-key`,
    ]);
    expect(groupNode.tags?.[0]?.label).toBe('2');
  });
});
