import { useContext } from 'react';
import { AuthorityContext } from '../context/AuthorityContext.jsx';

export function useAuthorityMode() {
  const ctx = useContext(AuthorityContext);
  if (!ctx) {
    throw new Error('useAuthorityMode must be used within AuthorityProvider');
  }
  return ctx;
}
