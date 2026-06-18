import { ColorModeToggle } from "@/components/ColorModeToggle";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          General operator settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
              <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Color mode</p>
              <p className="m-0">
                Controls whether the interface uses a light or dark color scheme. &apos;System&apos; follows your
                device setting.
              </p>
            </div>
            <ColorModeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visual theme (developer preview)</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

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
