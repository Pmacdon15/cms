import type { ReactNode } from "react";
import AuthHeader from "./AuthHeader";

export default function AuthContainer({ children }: { children?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <main className="relative z-10 flex flex-col items-center gap-6 p-6">
        <AuthHeader />
        {children}
      </main>
    </div>
  );
}
