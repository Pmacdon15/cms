import Logo from "@/components/Logo";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <main className="relative z-10 p-6 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="font-extrabold text-2xl tracking-wider text-zinc-900 font-display">
            CMS<span className="text-blue-600 font-semibold"> Pro</span>
          </span>
        </div>
      </main>
    </div>
  );
}
