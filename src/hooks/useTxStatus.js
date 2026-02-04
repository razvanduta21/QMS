import { useState } from 'react';

export function useTxStatus() {
  const [status, setStatus] = useState('idle');

  const start = () => setStatus('pending');
  const succeed = () => setStatus('success');
  const fail = () => setStatus('error');

  return { status, start, succeed, fail };
}
