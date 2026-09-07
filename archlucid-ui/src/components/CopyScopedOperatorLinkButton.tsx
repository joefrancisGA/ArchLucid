"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildShareableOperatorUrl, copyShareableOperatorLink } from "@/lib/shareable-operator-link";
import { showError, showSuccess } from "@/lib/toast";

export type CopyScopedOperatorLinkButtonProps = {
  readonly label?: string;
  readonly testId?: string;
};

export function CopyScopedOperatorLinkButton(props: CopyScopedOperatorLinkButtonProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  const onCopy = useCallback(async () => {
    setBusy(true);

    try {
      const href = buildShareableOperatorUrl(pathname, searchParams);
      const ok = await copyShareableOperatorLink(href);

      if (ok) {
        showSuccess("Scoped link copied to clipboard.");
      }
      else {
        showError("Could not copy scoped link", "Clipboard access is unavailable in this browser.");
      }
    }
    finally {
      setBusy(false);
    }
  }, [pathname, searchParams]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      data-testid={props.testId ?? "infra-copy-scoped-link"}
      onClick={() => void onCopy()}
    >
      {props.label ?? "Copy scoped link"}
    </Button>
  );
}
