export default function DispatchLogsSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-4 shadow-sm shadow-zinc-100/55 animate-pulse">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="h-5 w-40 bg-zinc-200 rounded" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
      </div>
    </div>
  );
}
