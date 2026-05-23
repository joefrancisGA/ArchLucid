import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          General operator settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Support bundle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          <p className="m-0">Download a redacted diagnostics ZIP when opening a support ticket.</p>
          <SupportBundleDownloadButton />
        </CardContent>
      </Card>
    </div>
  );
}
