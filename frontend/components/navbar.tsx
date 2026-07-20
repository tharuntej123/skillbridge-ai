"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Briefcase, BookOpen, User as UserIcon, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount & when pathname changes
    setRole(localStorage.getItem("role"));
    setToken(localStorage.getItem("token"));
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    setRole(null);
    setToken(null);
    router.push("/");
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: !!token,
    },
    {
      name: "Jobs Board",
      href: "/jobs",
      icon: Briefcase,
      show: !!token,
    },
    {
      name: "Learning Roadmap",
      href: "/roadmap",
      icon: BookOpen,
      show: token && role === "student",
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: UserIcon,
      show: !!token,
    },
  ];

  const activeLink = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            SkillBridge<span className="text-gradient"> AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center space-x-1 md:flex">
          {navLinks
            .filter((link) => link.show)
            .map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeLink(link.href)
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
        </div>

        {/* Auth Buttons */}
        <div className="hidden items-center space-x-3 md:flex">
          {token ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-all hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl btn-gradient px-4 py-2 text-sm font-medium text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="mt-4 rounded-2xl bg-slate-950/95 p-4 border border-white/5 md:hidden">
          <div className="flex flex-col space-y-3">
            {navLinks
              .filter((link) => link.show)
              .map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      activeLink(link.href)
                        ? "bg-white/10 text-white"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            
            <hr className="border-white/5 my-2" />
            
            {token ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center rounded-xl btn-gradient px-4 py-3 text-sm font-medium text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
