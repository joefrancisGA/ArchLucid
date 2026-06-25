import { ColorModeToggle } from "@/components/ColorModeToggle";
import { AuthorityThemeDevSelector } from "@/components/settings/AuthorityThemeDevSelector";
import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Settings</h1>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          General operator settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className={cn("space-y-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Visual theme (developer preview)</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorityThemeDevSelector />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Support bundle</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">Download a redacted diagnostics ZIP when opening a support ticket.</p>
          <SupportBundleDownloadButton />
        </CardContent>
      </Card>
    </div>
  );
}
