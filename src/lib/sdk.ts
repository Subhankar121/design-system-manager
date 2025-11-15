import { PresetSnapshot } from '@/types';
import { SNAPSHOT_STORAGE_PREFIX } from './mockApi';

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const readSnapshot = (snapshotId: string): PresetSnapshot | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`${SNAPSHOT_STORAGE_PREFIX}${snapshotId}`);
  return raw ? (JSON.parse(raw) as PresetSnapshot) : null;
};

export async function fetchSnapshot(presetId: string, version?: string) {
  await delay();
  if (typeof window === 'undefined') return null;
  const versionKey = `dsm:versions:${presetId}`;
  const versionsRaw = window.localStorage.getItem(versionKey);
  if (!versionsRaw) return null;
  const versions = JSON.parse(versionsRaw) as { snapshotId: string; version: string }[];
  const match = version
    ? versions.find((v) => v.version === version)
    : versions.length
    ? versions[0]
    : null;
  if (!match) return null;
  return readSnapshot(match.snapshotId);
}

