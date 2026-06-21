export default function DispatchLogsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-100/55">
      <div className="flex items-center justify-between border-zinc-100 border-b pb-4">
        <div className="h-5 w-40 rounded bg-zinc-200" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
        <div className="h-16 rounded-xl border border-zinc-100 bg-zinc-50/20" />
      </div>
    </div>
  );
}
