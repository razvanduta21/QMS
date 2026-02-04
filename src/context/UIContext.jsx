import { createContext, useMemo, useState } from 'react';

export const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (payload) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3200);
  };

  const value = useMemo(
    () => ({
      toast,
      showToast
    }),
    [toast]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
