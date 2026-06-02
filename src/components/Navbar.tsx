"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Send, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clients Directory", href: "/clients", icon: Users },
    { name: "Campaigns & SMS", href: "/campaigns", icon: Send },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo with Violet Accents */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            Ω
          </div>
          <span className="font-extrabold text-md tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 to-zinc-400 group-hover:from-white group-hover:to-zinc-300 transition-colors">
            APEX<span className="text-violet-500">CMS</span>
          </span>
        </Link>

        {/* Center Nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-900 text-violet-400 border border-zinc-800"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-4">
          {/* Mobile responsive link indicators */}
          <div className="flex md:hidden items-center gap-3 mr-2 border-r border-zinc-800 pr-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg ${
                    isActive ? "text-violet-400 bg-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={item.name}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  "w-8.5 h-8.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:scale-105 transition-transform duration-200 shadow-sm",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
export default Navbar;
