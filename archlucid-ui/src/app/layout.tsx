import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { MARKETING_ROOT_OG_DESCRIPTION } from "@/lib/marketing-open-graph";
import { PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE } from "@/lib/persona-shell-vocabulary";
import { getSiteMetadataBaseUrl } from "@/lib/site-metadata-base";
import { resolveAuthorityThemeFromEnv } from "@/lib/ui-authority-theme";

import "./globals.css";

const siteUrl = getSiteMetadataBaseUrl();
const authorityThemeEnvDefault = resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME);

export const viewport: Viewport = { themeColor: "#1E3A5F" };

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE,
    template: "%s · ArchLucid",
  },
  description: MARKETING_ROOT_OG_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ArchLucid",
    title: "ArchLucid",
    description: MARKETING_ROOT_OG_DESCRIPTION,
    images: [
      {
        url: "/logo/og-default.png",
        width: 1200,
        height: 630,
        alt: "ArchLucid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchLucid",
    description: MARKETING_ROOT_OG_DESCRIPTION,
    images: ["/logo/og-default.png"],
  },
};

/** Root layout: global styles only. Route groups supply operator shell (`(operator)/layout`) or marketing chrome (`(marketing)/layout`). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              `(function(){try{var colorKey='archlucid_color_mode';var mode=localStorage.getItem(colorKey)||'system';var dark=mode==='dark'||(mode!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);var themeKey='archlucid_authority_theme';var def='${authorityThemeEnvDefault}';var theme=localStorage.getItem(themeKey);if(theme!=='charcoal'&&theme!=='default'){theme=def;}document.documentElement.setAttribute('data-al-authority-theme',theme==='charcoal'?'charcoal':'default');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
