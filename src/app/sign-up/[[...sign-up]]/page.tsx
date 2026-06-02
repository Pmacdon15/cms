import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Decorative premium ambient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 p-6 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-violet-500/20">
            Ω
          </div>
          <span className="font-extrabold text-2xl tracking-wider text-white">
            APEX<span className="text-violet-500">CMS</span>
          </span>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#8b5cf6",
              colorBackground: "#09090b",
              colorText: "#f4f4f5",
              colorInputBackground: "#18181b",
              colorInputText: "#f4f4f5",
              colorTextSecondary: "#a1a1aa",
            },
            elements: {
              card: "border border-zinc-800 bg-zinc-950/40 backdrop-blur-md rounded-2xl shadow-xl",
              socialButtonsBlockButton:
                "border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100",
              formButtonPrimary:
                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white",
              footerActionLink: "text-violet-400 hover:text-violet-300",
            },
          }}
        />
      </main>
    </div>
  );
}
