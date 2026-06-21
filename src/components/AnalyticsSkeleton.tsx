export default function AnalyticsSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex h-28 items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
        <div className="flex w-2/3 flex-col gap-2">
          <div className="h-3 w-16 rounded bg-zinc-200" />
          <div className="h-8 w-12 rounded bg-zinc-200" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-zinc-100" />
      </div>
      <div className="flex h-28 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex w-2/3 flex-col gap-2">
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="h-6 w-16 rounded bg-zinc-200" />
          </div>
          <div className="h-6 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-100" />
      </div>
      <div className="flex h-28 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex w-2/3 flex-col gap-2">
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="h-6 w-16 rounded bg-zinc-200" />
          </div>
          <div className="h-6 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}
