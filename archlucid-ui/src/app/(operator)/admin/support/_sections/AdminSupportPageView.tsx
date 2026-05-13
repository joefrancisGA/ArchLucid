"use client";

import { Button } from "@/components/ui/button";

import type { UseAdminSupportPageModel } from "./use-admin-support-page";

type AdminSupportPageViewProps = {
  model: UseAdminSupportPageModel;
};

export function AdminSupportPageView({ model }: AdminSupportPageViewProps) {
  const { downloading, error, isDemo, onDownload } = model;

  if (isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Support tools not available in demo mode.</p>
        <p className="m-0 mt-1">Support bundle downloads are available to operators with a live API connection.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Support</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Download a redacted support bundle to attach to a ticket. The bundle summarizes deployment context your
          administrator approves sharing. For questions before you export, contact{" "}
          <a className="text-teal-800 underline dark:text-teal-300" href="mailto:support@archlucid.net">
            support@archlucid.net
          </a>
          .
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <Button
          type="button"
          data-testid="admin-support-download-bundle"
          disabled={downloading}
          onClick={() => void onDownload()}
        >
          {downloading ? "Preparing bundle…" : "Download support bundle"}
        </Button>

        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Download requires appropriate API permissions for your tenant. Review the bundle before sharing outside your
          organization.
        </p>

        {error !== null ? (
          <p
            role="alert"
            className="rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
            data-testid="admin-support-download-error"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
