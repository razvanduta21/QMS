import { createContext, useMemo, useState } from 'react';
import { authorityConfig } from '../config/authority.config.js';

export const AuthorityContext = createContext(null);

export function AuthorityProvider({ children }) {
  const [mode, setMode] = useState(authorityConfig.defaultMode);

  const value = useMemo(
    () => ({
      mode,
      setMode
    }),
    [mode]
  );

  return <AuthorityContext.Provider value={value}>{children}</AuthorityContext.Provider>;
}
