"use client";

import { useCallback, useEffect, useId, useState } from "react";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type RetryableSectionProps<T> = {
  title: string;
  /** Loads data; on failure sets error message. */
  fetchData: () => Promise<T>;
  children: (data: T | null, loading: boolean, error: string | null) => ReactNode;
};

/**
 * Generic client section with explicit retry for async loads (tests and future islands).
 */
export function RetryableSection<T>({ title, fetchData, children }: RetryableSectionProps<T>) {
  const headingId = useId();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData();
      setData(result);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      {error !== null ? (
        <div className="mt-2">
          <p className="m-0 text-sm text-red-800 dark:text-red-200">{error}</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : (
        children(data, loading, error)
      )}
    </section>
  );
}
