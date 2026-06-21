import Logo from "@/components/Logo";

export default function AuthHeader() {
  return (
    <div className="flex items-center gap-3">
      <Logo className="h-10 w-10" />
      <span className="font-display font-extrabold text-2xl text-zinc-900 tracking-wider">
        CMS<span className="font-semibold text-blue-600"> Pro</span>
      </span>
    </div>
  );
}
