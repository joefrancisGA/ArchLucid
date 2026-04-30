"use client";

import Image from "next/image";
import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ArchLucidWordmarkLinkProps = Omit<LinkProps, "children"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
  variant: "operator" | "marketing";
  "aria-label": string;
  /** Merged with Radix <Button asChild> and layout utilities. */
  className?: string;
};

/**
 * Header wordmark: light/dark SVG pair from /public/logo (`unoptimized` — Next image pipeline skips SVG by default).
 * Use inside <Button asChild> so Radix merges focus styles onto the anchor.
 */
export const ArchLucidWordmarkLink = forwardRef<HTMLAnchorElement, ArchLucidWordmarkLinkProps>(
  function ArchLucidWordmarkLink({ variant, className, ...linkProps }, ref) {
    const heightClass = variant === "operator" ? "h-8" : "h-7";

    return (
      <Link
        ref={ref}
        {...linkProps}
        className={cn("inline-flex shrink-0 items-center focus:outline-none", heightClass, className)}
      >
        <Image
          src="/logo/archlucid.svg"
          alt=""
          width={220}
          height={60}
          className={cn(heightClass, "w-auto dark:hidden")}
          unoptimized
        />

        <Image
          src="/logo/archlucid-dark.svg"
          alt=""
          width={220}
          height={60}
          className={cn("hidden", heightClass, "w-auto dark:block")}
          unoptimized
        />
      </Link>
    );
  },
);
