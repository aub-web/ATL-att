"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="white" strokeWidth="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="7" cy="7" r="2.5" stroke="white" strokeWidth="1.5" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2" stroke="white" strokeWidth="1.5" />
      <path d="M12.5 9.2c1.9.3 3.5 1.6 3.5 3.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 16V9M10 16V4M16 16v-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 16.5h15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M3 9.5 10 3l7 6.5M4.5 8v8h11V8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 16v-4h4v4" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/admin", label: "Attendance", color: "bg-sky-500", icon: CalendarIcon },
  { href: "/admin/roster", label: "Roster", color: "bg-violet-500", icon: UsersIcon },
  { href: "/admin/summary", label: "Summary", color: "bg-emerald-500", icon: ChartIcon },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-[#6F1F3B]">
      <div className="px-5 py-6">
        <p className="text-base font-semibold tracking-tight text-white">
          Atlas Capture
        </p>
        <p className="mt-0.5 text-xs text-white/60">Outbound Team</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg border-l-2 py-2 pl-2.5 pr-3 text-sm font-medium transition ${
                active
                  ? "border-emerald-400 bg-white/10 text-white"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${item.color}`}
              >
                <Icon />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-2.5 pr-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
            <HomeIcon />
          </span>
          Home
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
