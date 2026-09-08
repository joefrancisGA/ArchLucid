import type { ReactNode } from "react";

import {
  QUICK_SCAN_PRIMARY_CONTENT_ID,
  QUICK_SCAN_SKIP_LINK_LABEL,
  QUICK_SCAN_SKIP_TARGET_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type QuickScanPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/quick-scan` — skip link, hero, and primary workspace body. */
export function QuickScanPageChrome(props: QuickScanPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${QUICK_SCAN_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {QUICK_SCAN_SKIP_LINK_LABEL}
      </a>

      {hero}

      <div
        id={QUICK_SCAN_PRIMARY_CONTENT_ID}
        data-testid={QUICK_SCAN_PRIMARY_CONTENT_ID}
        className="scroll-mt-24 space-y-10"
      >
        {children}
      </div>
    </>
  );
}
