import { SignUp } from "@clerk/nextjs";
import Logo from "@/components/Logo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <main className="relative z-10 p-6 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="font-extrabold text-2xl tracking-wider text-zinc-900 font-display">
            CMS<span className="text-blue-600 font-semibold"> Pro</span>
          </span>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
              colorBackground: "#ffffff",
              colorText: "#09090b",
              colorInputBackground: "#ffffff",
              colorInputText: "#09090b",
              colorTextSecondary: "#71717a",
            },
            elements: {
              card: "border border-zinc-200 bg-white rounded-2xl shadow-xl shadow-zinc-250/30",
              socialButtonsBlockButton:
                "border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              footerActionLink: "text-blue-600 hover:text-blue-700",
            },
          }}
        />
      </main>
    </div>
  );
}
