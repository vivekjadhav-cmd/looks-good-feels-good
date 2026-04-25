"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Sparkles, Calendar, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/style-me", label: "Style Me", icon: Sparkles, primary: true },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center -mt-4"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-soft transition-all duration-200 ${
                    isActive
                      ? "bg-sage-400 text-white scale-105"
                      : "bg-sage-50 text-sage-800"
                  }`}
                >
                  <Icon size={24} />
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isActive ? "text-sage-600" : "text-neutral-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-2"
            >
              <Icon
                size={22}
                className={`transition-colors duration-200 ${
                  isActive ? "text-warm-600" : "text-neutral-400"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-warm-600" : "text-neutral-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
