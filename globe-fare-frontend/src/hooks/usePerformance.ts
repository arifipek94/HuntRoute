import { useCallback, useEffect, useMemo, useRef } from 'react';

// Enhanced debounce hook with cancellation and immediate execution option
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    immediate?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef<number>();
  const lastInvokeTimeRef = useRef<number>(0);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      if (lastCallTimeRef.current) {
        lastInvokeTimeRef.current = Date.now();
        return callbackRef.current();
      }
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastCallTimeRef.current = now;

      // Immediate execution on first call
      if (options.immediate && !timeoutRef.current) {
        lastInvokeTimeRef.current = now;
        return callbackRef.current(...args);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up max wait timeout if specified
      if (options.maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          lastInvokeTimeRef.current = now;
          callbackRef.current(...args);
          cancel();
        }, options.maxWait);
      }

      // Set up regular debounce timeout
      timeoutRef.current = setTimeout(() => {
        lastInvokeTimeRef.current = now;
        callbackRef.current(...args);
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = undefined;
        }
      }, delay);
    },
    [delay, options.immediate, options.maxWait, cancel]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  // Attach cancel and flush methods
  (debouncedCallback as any).cancel = cancel;
  (debouncedCallback as any).flush = flush;

  return debouncedCallback as T & { cancel: () => void; flush: () => void };
}

// Throttle hook for rate limiting
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastInvokeTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  const { leading = true, trailing = true } = options;

  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

      if (lastInvokeTimeRef.current === 0 && leading) {
        lastInvokeTimeRef.current = now;
        return callbackRef.current(...args);
      }

      if (timeSinceLastInvoke >= delay) {
        lastInvokeTimeRef.current = now;
        return callbackRef.current(...args);
      }

      if (trailing && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastInvokeTimeRef.current = Date.now();
          callbackRef.current(...args);
          timeoutRef.current = undefined;
        }, delay - timeSinceLastInvoke);
      }
    },
    [delay, leading, trailing]
  ) as T;

  useEffect(() => {
    return cancel;
  }, [cancel]);

  (throttledCallback as any).cancel = cancel;

  return throttledCallback as T & { cancel: () => void };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string, enabled = false) {
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = performance.now();
    console.log(`[PERF] ${name} - Start`);

    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        console.log(`[PERF] ${name} - Duration: ${duration.toFixed(2)}ms`);
      }
    };
  }, [name, enabled]);

  const mark = useCallback(
    (label: string) => {
      if (!enabled || !startTimeRef.current) return;

      const duration = performance.now() - startTimeRef.current;
      console.log(`[PERF] ${name}.${label} - ${duration.toFixed(2)}ms`);
    },
    [name, enabled]
  );

  return { mark };
}

// Memoized search filtering with performance optimization
export function useOptimizedFilter<T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[],
  options: {
    maxResults?: number;
    prioritizeExactMatches?: boolean;
    caseSensitive?: boolean;
  } = {}
) {
  const {
    maxResults = 100,
    prioritizeExactMatches = true,
    caseSensitive = false,
  } = options;

  return useMemo(() => {
    if (!query.trim()) return items.slice(0, maxResults);

    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const results: { item: T; score: number }[] = [];

    for (const item of items) {
      let score = 0;
      let hasMatch = false;

      for (const field of searchFields) {
        const value = item[field];
        if (typeof value !== 'string') continue;

        const fieldValue = caseSensitive ? value : value.toLowerCase();

        // Exact match (highest priority)
        if (fieldValue === searchQuery) {
          score += 100;
          hasMatch = true;
        }
        // Starts with query
        else if (fieldValue.startsWith(searchQuery)) {
          score += 50;
          hasMatch = true;
        }
        // Contains query
        else if (fieldValue.includes(searchQuery)) {
          score += 25;
          hasMatch = true;
        }
      }

      if (hasMatch) {
        results.push({ item, score });
      }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, maxResults).map(r => r.item);
  }, [
    items,
    query,
    searchFields,
    maxResults,
    prioritizeExactMatches,
    caseSensitive,
  ]);
}

// Memory usage monitoring
export function useMemoryMonitor(enabled = false) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('[MEMORY]', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        });
      }
    };

    const interval = setInterval(checkMemory, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [enabled]);
}
