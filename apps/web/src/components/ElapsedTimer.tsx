import { useEffect, useState } from 'react';
import { formatElapsed } from '../lib/formatters.ts';

export function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-center text-4xl font-bold tabular-nums text-emerald-400">
      {formatElapsed(startedAt, now)}
    </p>
  );
}
