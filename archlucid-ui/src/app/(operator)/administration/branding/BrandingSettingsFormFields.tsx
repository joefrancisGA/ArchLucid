"use client";

import { BaselineFieldMessage } from "@/components/forms/BaselineFieldMessage";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  TENANT_BRANDING_ACTIVATE_READINESS_PREFIX,
} from "@/lib/tenant-branding-settings-page-copy";
import { cn } from "@/lib/utils";

import { BrandingSettingsPreviewPanels } from "./BrandingSettingsPreviewPanels";
import type { TenantBrandingAdminSettingsState } from "./use-tenant-branding-admin-settings";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";

type BrandingSettingsFormFieldsProps = TenantBrandingAdminSettingsState & {
  readonly canEdit: boolean;
};

function ValidationIssuesList(props: {
  readonly issues: TenantBrandingAdminSettingsState["serverIssues"];
}) {
  if (props.issues.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 list-disc space-y-1 pl-5" data-testid="branding-validation-issues">
      {props.issues.map((issue) => (
        <li key={`${issue.code}-${issue.message}`} className={OPERATOR_TYPOGRAPHY.helper}>
          <StatusTag
            kind={issue.severity === "Error" ? "blocked" : "needs-attention"}
            label={issue.severity}
          />
          <span className="ml-2">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function BrandingSettingsFormFields(props: BrandingSettingsFormFieldsProps) {
  const { productLine } = useProductLine();
  const productName = productLineDisplayName(productLine);
  const {
    canEdit,
    fields,
    setFields,
    fieldValidation,
    canActivate,
    saveConfirmation,
    saveError,
    actionError,
    uploadingLogo,
    mutating,
    onSaveDraft,
    onActivate,
    onRevert,
    onUploadPrimaryLogo,
    activeSummary,
    serverIssues,
  } = props;

  const readOnly = !canEdit || mutating;

  return (
    <form className="space-y-6" onSubmit={onSaveDraft}>
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="branding-company-display-name">Company display name</Label>
            <Input
              id="branding-company-display-name"
              value={fields.companyDisplayName}
              onChange={(event) => setFields({ ...fields, companyDisplayName: event.target.value })}
              readOnly={readOnly}
              aria-invalid={fieldValidation.companyDisplayNameError !== null}
              data-testid="branding-company-display-name"
            />
            <BaselineFieldMessage error={fieldValidation.companyDisplayNameError} />
          </div>

          <div>
            <Label htmlFor="branding-company-legal-name">Company legal name</Label>
            <Input
              id="branding-company-legal-name"
              value={fields.companyLegalName}
              onChange={(event) => setFields({ ...fields, companyLegalName: event.target.value })}
              readOnly={readOnly}
            />
          </div>

          <div>
            <Label htmlFor="branding-tagline">Tagline</Label>
            <Input
              id="branding-tagline"
              value={fields.tagline}
              onChange={(event) => setFields({ ...fields, tagline: event.target.value })}
              readOnly={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["primaryColor", "Primary", fieldValidation.primaryColorError],
              ["secondaryColor", "Secondary", null],
              ["accentColor", "Accent", null],
              ["backgroundColor", "Background", fieldValidation.backgroundColorError],
              ["foregroundColor", "Foreground", fieldValidation.foregroundColorError],
            ] as const
          ).map(([key, label, error]) => (
            <div key={key}>
              <Label htmlFor={`branding-${key}`}>{label}</Label>
              <Input
                id={`branding-${key}`}
                value={fields[key]}
                onChange={(event) => setFields({ ...fields, [key]: event.target.value })}
                readOnly={readOnly}
                aria-invalid={error !== null}
                data-testid={`branding-${key}`}
              />
              <BaselineFieldMessage error={error} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="branding-primary-logo">Primary logo (SVG, PNG, or JPEG)</Label>
            <Input
              id="branding-primary-logo"
              type="file"
              accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
              disabled={readOnly || uploadingLogo}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void onUploadPrimaryLogo(file);
                }
              }}
              data-testid="branding-primary-logo-upload"
            />
            {fields.logoPrimaryAssetId ? (
              <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Uploaded asset id: {fields.logoPrimaryAssetId}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previews</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandingSettingsPreviewPanels settings={props} />
        </CardContent>
      </Card>

      <ValidationIssuesList issues={serverIssues} />

      {saveConfirmation ? <OperatorSuccessCallout message={saveConfirmation} /> : null}
      {saveError ? <OperatorMutationInlineError message={saveError} /> : null}
      {actionError ? <OperatorMutationInlineError message={actionError} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={readOnly}>
          Save draft
        </Button>
        <Button
          type="button"
          disabled={readOnly || !canActivate}
          title={canActivate ? undefined : fieldValidation.activateReadinessMessage ?? undefined}
          onClick={() => void onActivate()}
          data-testid="branding-activate-button"
        >
          Activate branding
        </Button>
        <Button type="button" variant="outline" disabled={readOnly} onClick={() => void onRevert()}>
          Revert to {productName} defaults
        </Button>
        {activeSummary.isActive ? (
          <StatusTag kind="ready" label={`Active v${activeSummary.version ?? "?"}`} />
        ) : (
          <StatusTag kind="neutral" label="Product defaults" />
        )}
      </div>

      {!canActivate && fieldValidation.activateReadinessMessage ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="branding-activate-readiness">
          {TENANT_BRANDING_ACTIVATE_READINESS_PREFIX} {fieldValidation.activateReadinessMessage}
        </p>
      ) : null}
    </form>
  );
}
