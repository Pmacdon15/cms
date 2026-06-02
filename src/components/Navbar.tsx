"use client";

import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/nextjs";
import { Layers, LayoutDashboard, Send, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const { has, isLoaded } = useAuth();

  const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasSms =
    !hasClerkKeys ||
    (isLoaded && has
      ? has({ permission: "send_sms" })
      : false);

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clients Directory", href: "/clients", icon: Users },
    { name: "Mailing Lists", href: "/mailing-lists", icon: Layers },
    {
      name: hasSms ? "Campaigns & SMS" : "Campaigns",
      href: "/campaigns",
      icon: Send,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo with Blue Accents */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
            Ω
          </div>
          <span className="font-extrabold text-md tracking-wider text-zinc-900 group-hover:text-black transition-colors">
            CMS<span className="text-blue-600 font-semibold"> Pro</span>
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
                    ? "bg-zinc-100 text-blue-600 border border-zinc-200/50"
                    : "text-zinc-550 hover:text-zinc-900 hover:bg-zinc-100/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-zinc-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-4">
          {/* Mobile responsive link indicators */}
          <div className="flex md:hidden items-center gap-3 mr-2 border-r border-zinc-200 pr-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg ${
                    isActive
                      ? "text-blue-600 bg-zinc-100"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                  title={item.name}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          {hasClerkKeys ? (
            <>
              <OrganizationSwitcher
                afterCreateOrganizationUrl="/"
                afterLeaveOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger:
                      "px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm text-sm font-semibold text-zinc-700",
                  },
                }}
              />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-8.5 h-8.5 rounded-xl border border-zinc-200 bg-zinc-100 hover:scale-105 transition-transform duration-200 shadow-sm",
                  },
                }}
              />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-650">
                🏢 Clerk Simulation Org
              </div>
              <div className="w-8.5 h-8.5 rounded-xl border border-zinc-200 bg-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700 shadow-sm">
                MA
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default Navbar;
