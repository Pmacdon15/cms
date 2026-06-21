"use client";

import { OrganizationSwitcher, UserButton, useAuth } from "@clerk/nextjs";
import { Layers, LayoutDashboard, Send, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId, has, isLoaded } = useAuth();

  // Preserve client search params across page navigation
  const buildHref = (basePath: string) => {
    const preserved = new URLSearchParams();
    const search = searchParams.get("search");
    const client = searchParams.get("client");
    if (search) preserved.set("search", search);
    if (client) preserved.set("client", client);
    const qs = preserved.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isSignedIn = !hasClerkKeys || (isLoaded && !!userId);
  const hasSms =
    !hasClerkKeys || (isLoaded && has ? has({ feature: "send_sms" }) : false);

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
    <header className="sticky top-0 z-40 w-full border-zinc-200 border-b bg-white/80 px-6 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo with Custom SVG Accent */}
        <Link href="/" className="group flex items-center gap-2">
          <Logo className="h-8 w-8 transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display font-extrabold text-md text-zinc-900 tracking-wider transition-colors group-hover:text-black">
            CMS<span className="font-semibold text-blue-600"> Pro</span>
          </span>
        </Link>

        {/* Center Nav tabs */}
        {isSignedIn ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? "border border-zinc-200/50 bg-zinc-100 text-blue-600"
                      : "text-zinc-550 hover:bg-zinc-100/60 hover:text-zinc-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-zinc-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="font-semibold text-sm text-zinc-550 transition-colors hover:text-zinc-900"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="font-semibold text-sm text-zinc-550 transition-colors hover:text-zinc-900"
            >
              Benefits
            </a>
            <a
              href="#security"
              className="font-semibold text-sm text-zinc-550 transition-colors hover:text-zinc-900"
            >
              Security
            </a>
          </nav>
        )}

        {/* User Account Controls */}
        <div className="flex items-center gap-4">
          {/* Mobile responsive link indicators */}
          {isSignedIn && (
            <div className="mr-2 flex items-center gap-3 border-zinc-200 border-r pr-3 md:hidden">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={buildHref(item.href)}
                    className={`rounded-lg p-2 ${
                      isActive
                        ? "bg-zinc-100 text-blue-600"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                    title={item.name}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          )}

          {hasClerkKeys ? (
            isSignedIn ? (
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
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-xl px-3 py-1.5 font-semibold text-sm text-zinc-650 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="active-scale-98 rounded-xl bg-blue-600 px-4 py-1.5 font-semibold text-sm text-white shadow-sm transition-all hover:scale-102 hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-semibold text-xs text-zinc-650">
                🏢 Clerk Simulation Org
              </div>
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-200 font-bold text-xs text-zinc-700 shadow-sm">
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
