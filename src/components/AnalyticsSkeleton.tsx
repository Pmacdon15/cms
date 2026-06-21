export default function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      <div className="p-6 h-28 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between shadow-sm shadow-zinc-100/55">
        <div className="flex flex-col gap-2 w-2/3">
          <div className="h-3 w-16 bg-zinc-200 rounded" />
          <div className="h-8 w-12 bg-zinc-200 rounded" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-zinc-100" />
      </div>
      <div className="p-6 h-28 rounded-2xl border border-zinc-200 bg-white flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2 w-2/3">
            <div className="h-3 w-24 bg-zinc-200 rounded" />
            <div className="h-6 w-16 bg-zinc-200 rounded" />
          </div>
          <div className="w-10 h-6 bg-zinc-200 rounded-full" />
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full" />
      </div>
      <div className="p-6 h-28 rounded-2xl border border-zinc-200 bg-white flex flex-col gap-4 shadow-sm shadow-zinc-100/55">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2 w-2/3">
            <div className="h-3 w-24 bg-zinc-200 rounded" />
            <div className="h-6 w-16 bg-zinc-200 rounded" />
          </div>
          <div className="w-10 h-6 bg-zinc-200 rounded-full" />
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full" />
      </div>
    </div>
  );
}
