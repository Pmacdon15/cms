import type { ReactNode } from "react";
import AuthHeader from "./AuthHeader";

export default function AuthContainer({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <main className="relative z-10 p-6 flex flex-col items-center gap-6">
        <AuthHeader />
        {children}
      </main>
    </div>
  );
}
