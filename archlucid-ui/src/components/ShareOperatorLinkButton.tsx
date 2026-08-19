"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildShareableOperatorUrl, copyShareableOperatorLink } from "@/lib/shareable-operator-link";
import { showSuccess } from "@/lib/toast";

export type ShareOperatorLinkButtonProps = {
  readonly pathnameOverride?: string;
  readonly label?: string;
};

/** Copies a stable shareable URL for the current operator page. */
export function ShareOperatorLinkButton(props: ShareOperatorLinkButtonProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const targetPath = props.pathnameOverride ?? pathname;
  const [busy, setBusy] = useState(false);

  const onCopy = useCallback(async () => {
    setBusy(true);

    try {
      const href = buildShareableOperatorUrl(targetPath);
      const ok = await copyShareableOperatorLink(href);

      if (ok) {
        showSuccess("Link copied to clipboard.");
      }
    }
    finally {
      setBusy(false);
    }
  }, [targetPath]);

  return (
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void onCopy()}>
      {props.label ?? "Copy shareable link"}
    </Button>
  );
}
