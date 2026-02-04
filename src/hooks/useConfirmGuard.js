import { useEffect } from 'react';

export function useConfirmGuard(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}
