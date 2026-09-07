import { ArrowClockwise, Cube, WarningCircle } from '@phosphor-icons/react';
import type { WidgetTier } from '../types';
import { useDockerStatus, type DockerContainer } from '../hooks/useDockerStatus';

export function DockerStatus({ tier = 'compact' }: { tier?: WidgetTier }) {
  const { data, error, isLoading, isFetching, refetch } = useDockerStatus();

  if (isLoading) return <LoadingDocker />;
  if (error || !data) return <DockerUnavailable detail={error} />;

  if (tier === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2">
        <Cube size={28} weight="thin" className="opacity-70" />
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-4xl tracking-tighter">{data.running}</span>
          <span className="font-sans text-[10px] uppercase tracking-widest opacity-40">running</span>
        </div>
        <span className="font-sans text-[9px] uppercase tracking-widest opacity-40">{data.total} containers</span>
      </div>
    );
  }

  const visibleContainers = data.containers.slice(0, tier === 'expanded' ? 8 : 4);
  return (
    <div className="flex flex-col w-full h-full py-4 px-5">
      <div className="flex items-start justify-between border-b-[1px] border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 bg-charcoal" />
          <div>
            <span className="block font-sans text-xs uppercase tracking-widest">Engine online</span>
            <span className="font-mono text-[9px] opacity-35">{data.version ? `v${data.version}` : data.source}</span>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh Docker status"
          className="p-1 opacity-35 hover:opacity-80 disabled:opacity-20 transition-opacity cursor-pointer"
        >
          <ArrowClockwise size={14} weight="thin" className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-3 py-4 border-b-[1px] border-border">
        <Metric label="Running" value={data.running} />
        <Metric label="Stopped" value={data.stopped} />
        <Metric label="Total" value={data.total} />
      </div>

      <div className="flex-1 flex flex-col gap-2.5 pt-4 overflow-hidden">
        {visibleContainers.length === 0 ? (
          <span className="font-sans text-[10px] uppercase tracking-widest opacity-30 text-center pt-2">No containers</span>
        ) : visibleContainers.map(container => <ContainerRow key={container.id || container.name} container={container} />)}
      </div>
      {data.total > visibleContainers.length && (
        <span className="font-sans text-[9px] uppercase tracking-widest opacity-35 mt-2">+ {data.total - visibleContainers.length} more</span>
      )}
    </div>
  );
}

function LoadingDocker() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
      <Cube size={28} weight="thin" className="opacity-30 animate-pulse" />
      <span className="font-sans text-[10px] uppercase tracking-widest opacity-35">Checking engine</span>
    </div>
  );
}

function DockerUnavailable({ detail }: { detail?: { message: string; setup: string } | null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 px-5 w-full h-full">
      <WarningCircle size={24} weight="thin" className="opacity-60" />
      <div>
        <span className="block font-sans text-[10px] uppercase tracking-widest">Docker unavailable</span>
        <span className="block font-sans text-[10px] leading-relaxed opacity-45 mt-2 max-w-[220px]">{detail?.setup || 'Could not reach the Docker daemon.'}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 border-r-[1px] border-border last:border-r-0">
      <span className="font-serif text-2xl tracking-tighter">{value}</span>
      <span className="font-sans text-[8px] uppercase tracking-widest opacity-40">{label}</span>
    </div>
  );
}

function ContainerRow({ container }: { container: DockerContainer }) {
  const running = container.state === 'running';
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={`w-1.5 h-1.5 shrink-0 ${running ? 'bg-charcoal' : 'border-[1px] border-charcoal/35'}`} />
      <span className="font-sans text-xs tracking-wide truncate flex-1">{container.name}</span>
      <span className="font-mono text-[9px] opacity-35 truncate max-w-[36%]">{container.image}</span>
    </div>
  );
}
