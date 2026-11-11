import type { ConnectionStatus as Status } from '../hooks/useWebSocket.ts';

const STYLES: Record<Status, { label: string; dot: string }> = {
  open: { label: 'Connected', dot: 'bg-emerald-500' },
  connecting: { label: 'Connecting…', dot: 'bg-amber-400 animate-pulse' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-rose-500 animate-pulse' },
};

export function ConnectionStatus({ status }: { status: Status }) {
  const { label, dot } = STYLES[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600" role="status">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
