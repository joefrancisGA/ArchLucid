import { Button } from "@/components/ui/button";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE,
} from "@/lib/buyer-polish-copy";

export type ManifestBuyerBundleDownloadSectionProps = {
  readonly manifestId: string;
};

/** Collapsed bundle download — placed after deliverables on buyer manifest pages. */
export function ManifestBuyerBundleDownloadSection(props: ManifestBuyerBundleDownloadSectionProps) {
  const { manifestId } = props;

  return (
    <details
      id="manifest-bundle-zip"
      className="scroll-mt-24 rounded-lg border border-neutral-200/90 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30"
      data-testid="manifest-buyer-bundle-download"
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-neutral-900 outline-none marker:text-neutral-500 focus-visible:ring-2 focus-visible:ring-teal-500/80 dark:text-neutral-100">
        {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        <p className="m-0 max-w-prose text-sm text-neutral-800 dark:text-neutral-200">
          Prefer the consolidated bundle for diligence and archiving — it packages the downloadable outputs that align to
          the decisions and deliverables summarized on this page.
        </p>
        <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">{BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" asChild>
            <a href={getBundleDownloadUrl(manifestId)}>Download finalized review package</a>
          </Button>
        </div>
      </div>
    </details>
  );
}
