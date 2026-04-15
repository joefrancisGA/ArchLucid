import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppToaster } from "@/components/AppToaster";
import { AuthPanel } from "@/components/AuthPanel";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { KeyboardShortcutProvider } from "@/components/KeyboardShortcutProvider";
import { ShellNav } from "@/components/ShellNav";
import { Button } from "@/components/ui/button";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ArchLucid operator shell",
    template: "%s · ArchLucid",
  },
  description:
    "Operator UI for architecture runs, manifests, artifacts, graphs, compare, replay, and governance.",
};

/** Root layout: shell chrome (header, grouped nav, auth) and page content. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='archlucid_color_mode';var m=localStorage.getItem(k)||'system';var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div className="mx-auto max-w-7xl p-6">
          <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-700">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                <Button variant="ghost" className="h-auto p-0 text-2xl font-semibold" asChild>
                  <Link href="/" aria-label="ArchLucid — go to operator home">
                    ArchLucid
                  </Link>
                </Button>
              </h1>
              <ColorModeToggle />
            </div>
            <ShellNav />
          </header>
          <AuthPanel />
          <AppToaster />
          <KeyboardShortcutProvider>
            <div
              id="main-content"
              tabIndex={-1}
              className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
            >
              {children}
            </div>
          </KeyboardShortcutProvider>
        </div>
      </body>
    </html>
  );
}
