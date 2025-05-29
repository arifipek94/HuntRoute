import { useEffect, useRef } from 'react';

export function useStateConflictDetector(state: unknown, stateName: string) {
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (JSON.stringify(prevStateRef.current) !== JSON.stringify(state)) {
        console.log(`State change in ${stateName}:`, {
          from: prevStateRef.current,
          to: state,
          timestamp: new Date().toISOString(),
        });
        prevStateRef.current = state;
      }
    }
  });
}

export function useRenderLogger(componentName: string, props?: unknown) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered:`, props);
    }
  });
}
