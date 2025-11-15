import { useCallback, useEffect, useRef, useState } from 'react';

type ChangeType = 'tokens' | 'components' | 'presets';

export function useResource<T>(fetcher: () => Promise<T>, type?: ChangeType) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetcher);

  useEffect(() => {
    fetchRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!type) return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ type: ChangeType }>;
      if (!custom.detail?.type || custom.detail.type === type) {
        refresh();
      }
    };
    window.addEventListener('dsm:change', handler);
    return () => window.removeEventListener('dsm:change', handler);
  }, [refresh, type]);

  return { data, loading, error, refresh };
}

