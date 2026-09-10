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
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const testId = props.testId ?? "infra-copy-scoped-link";

  const onCopy = useCallback(async () => {
    setBusy(true);

    const href = buildShareableOperatorUrl(pathname, searchParams);

    try {
      const ok = await copyShareableOperatorLink(href);

      if (ok) {
        setFallbackHref(null);
        showSuccess("Scoped link copied to clipboard.");
      }
      else {
        setFallbackHref(href);
        showError("Could not copy scoped link", "Clipboard access is unavailable in this browser.");
      }
    }
    finally {
      setBusy(false);
    }
  }, [pathname, searchParams]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        data-testid={testId}
        onClick={() => void onCopy()}
      >
        {props.label ?? "Copy scoped link"}
      </Button>
      {fallbackHref != null ? (
        <div className="grid w-full max-w-xl gap-1" data-testid={`${testId}-fallback`}>
          <p className="m-0 text-sm text-muted-foreground">
            Copy failed. Select and copy this URL manually:
          </p>
          <input
            readOnly
            className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-xs"
            value={fallbackHref}
            aria-label="Scoped operator link"
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
