import Logo from "@/components/Logo";

export default function AuthHeader() {
  return (
    <div className="flex items-center gap-3">
      <Logo className="w-10 h-10" />
      <span className="font-extrabold text-2xl tracking-wider text-zinc-900 font-display">
        CMS<span className="text-blue-600 font-semibold"> Pro</span>
      </span>
    </div>
  );
}
