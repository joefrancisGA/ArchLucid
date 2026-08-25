"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SsoActivateConsequencePreview } from "@/components/SsoActivateConsequencePreview";
import { sanitizeSsoWizardDiagnosticSummary } from "@/lib/sso-wizard-error-present";
import {
  SSO_WIZARD_ACTIVATE_INTRO,
  SSO_WIZARD_BEFORE_YOU_BEGIN_HEADING,
  SSO_WIZARD_BEFORE_YOU_BEGIN_INTRO,
  SSO_WIZARD_BEFORE_YOU_BEGIN_PROTOCOL_HINT,
  SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL,
  SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER,
  SSO_WIZARD_VERIFY_CLAIM_MAPPING_BUTTON,
  SSO_WIZARD_VERIFY_CLAIM_MAPPING_INTRO,
} from "@/lib/sso-wizard-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SsoWizardArchLucidSpValuesSection } from "./SsoWizardArchLucidSpValuesSection";
import { SsoWizardExistingConfigSummary } from "./SsoWizardExistingConfigSummary";
import { SsoWizardIdpSelector } from "./SsoWizardIdpSelector";
import { SsoWizardProtocolHelpDisclosure } from "./SsoWizardProtocolHelpDisclosure";
import { SsoWizardProtocolSelector } from "./SsoWizardProtocolSelector";
import {
  applySsoWizardIdpPreset,
  ARCHLUCID_ROLES,
  type SsoWizardState,
} from "./sso-wizard-state";
import type { SsoWizardExistingConfigSummary as SsoWizardExistingConfigSummaryModel } from "./sso-wizard-tenant-config";

export type SsoWizardStepContentProps = {
  step: number;
  state: SsoWizardState;
  busy: boolean;
  existingConfigSummary: SsoWizardExistingConfigSummaryModel | null;
  onStateChange: React.Dispatch<React.SetStateAction<SsoWizardState>>;
  onRunDiscover: () => void;
  onRunTestLogin: () => void;
};

export function SsoWizardStepContent({
  step,
  state,
  busy,
  existingConfigSummary,
  onStateChange,
  onRunDiscover,
  onRunTestLogin,
}: SsoWizardStepContentProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <>
        <div className="space-y-3" data-testid="sso-wizard-before-you-begin">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {SSO_WIZARD_BEFORE_YOU_BEGIN_HEADING}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_BEFORE_YOU_BEGIN_INTRO}</p>
          {state.protocol === null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {SSO_WIZARD_BEFORE_YOU_BEGIN_PROTOCOL_HINT}
            </p>
          ) : null}
        </div>
        <SsoWizardIdpSelector
          value={state.idpPresetId}
          disabled={busy}
          onChange={(idpPresetId) => onStateChange((prev) => applySsoWizardIdpPreset(prev, idpPresetId))}
        />
        {state.protocol !== null ? <SsoWizardArchLucidSpValuesSection protocol={state.protocol} /> : null}
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <SsoWizardProtocolSelector
          value={state.protocol}
          disabled={busy}
          onChange={(protocol) => onStateChange((prev) => ({ ...prev, protocol }))}
        />
        <SsoWizardArchLucidSpValuesSection protocol={state.protocol} />
        <SsoWizardProtocolHelpDisclosure />
      </>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Enter the metadata or discovery URL from your identity provider.
        </p>
        <div>
          <Label htmlFor="metadata-url">Metadata or discovery URL</Label>
          <Input
            id="metadata-url"
            value={state.metadataUrl}
            onChange={(e) => onStateChange((prev) => ({ ...prev, metadataUrl: e.target.value }))}
            placeholder={state.protocol === "saml" ? "https://idp.example.com/metadata/saml" : "https://login.example.com"}
            data-testid="sso-metadata-url"
          />
        </div>
        <Button type="button" variant="outline" disabled={busy || !state.metadataUrl.trim()} onClick={onRunDiscover}>
          Fetch provider metadata
        </Button>
        {state.issuerUri ? (
          <div className={cn("rounded-md border border-neutral-200 p-3 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              <strong>Issuer:</strong> {state.issuerUri}
            </p>
            {state.jwksUri ? (
              <p className="mt-2 m-0">
                <strong>JWKS URI:</strong> {state.jwksUri}
              </p>
            ) : null}
            {state.signingCertificateThumbprints.length > 0 ? (
              <p className="mt-2 m-0">
                <strong>Signing certificate thumbprints:</strong> {state.signingCertificateThumbprints.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="role-claim">Identity provider group or role claim</Label>
          <Input
            id="role-claim"
            list="sso-claim-names"
            value={state.claimMapping.roleClaimName}
            onChange={(e) =>
              onStateChange((prev) => ({
                ...prev,
                claimMapping: { ...prev.claimMapping, roleClaimName: e.target.value },
              }))
            }
            data-testid="sso-role-claim"
          />
          <datalist id="sso-claim-names">
            {state.availableClaimNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <EnterpriseTable ariaLabel="SSO role claim mappings" className={OPERATOR_TYPOGRAPHY.body} data-testid="sso-role-mapping-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
              <EnterpriseTableHeaderCell className="py-2 pr-2">Identity provider value</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell className="py-2">ArchLucid role</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {state.claimMapping.mappings.map((row, index) => (
              <EnterpriseTableRow key={`${row.archLucidRole}-${index}`}>
                <EnterpriseTableCell className="py-2 pr-2">
                  <Input
                    value={row.idpValue}
                    onChange={(e) => {
                      const value = e.target.value;

                      onStateChange((prev) => {
                        const mappings = [...prev.claimMapping.mappings];
                        mappings[index] = { ...mappings[index], idpValue: value };

                        return { ...prev, claimMapping: { ...prev.claimMapping, mappings } };
                      });
                    }}
                    placeholder="e.g. al-admin-group"
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell className="py-2">
                  <select
                    className={cn(
                      "w-full rounded-md border border-neutral-300 bg-white px-2 py-2 dark:border-neutral-600 dark:bg-neutral-900",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    value={row.archLucidRole}
                    onChange={(e) => {
                      const value = e.target.value;

                      onStateChange((prev) => {
                        const mappings = [...prev.claimMapping.mappings];
                        mappings[index] = { ...mappings[index], archLucidRole: value };

                        return { ...prev, claimMapping: { ...prev.claimMapping, mappings } };
                      });
                    }}
                  >
                    {ARCHLUCID_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
        <div>
          <Label htmlFor="group-regex">Optional group claim pattern</Label>
          <Input
            id="group-regex"
            value={state.claimMapping.customGroupClaimRegex ?? ""}
            onChange={(e) =>
              onStateChange((prev) => ({
                ...prev,
                claimMapping: { ...prev.claimMapping, customGroupClaimRegex: e.target.value },
              }))
            }
            placeholder="^AL-(Admin|Operator)-.*$"
          />
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="space-y-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_VERIFY_CLAIM_MAPPING_INTRO}</p>
        <div>
          <Label htmlFor="sample-claims">Sample identity provider claim values (comma or newline separated)</Label>
          <textarea
            id="sample-claims"
            className={cn(
              "min-h-[5rem] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
            value={state.sampleClaimValues}
            onChange={(e) => onStateChange((prev) => ({ ...prev, sampleClaimValues: e.target.value }))}
            data-testid="sso-sample-claims"
          />
        </div>
        <Button type="button" variant="outline" disabled={busy} onClick={onRunTestLogin}>
          {SSO_WIZARD_VERIFY_CLAIM_MAPPING_BUTTON}
        </Button>
        {state.testLoginSummary ? (
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="sso-test-login-summary">
            {sanitizeSsoWizardDiagnosticSummary(state.testLoginSummary)}
            {state.mappedRoles.length > 0 ? ` Roles: ${state.mappedRoles.join(", ")}.` : ""}
          </p>
        ) : null}
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="space-y-3">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_ACTIVATE_INTRO}</p>
        {existingConfigSummary !== null ? <SsoWizardExistingConfigSummary summary={existingConfigSummary} /> : null}
        <div>
          <Label htmlFor="kv-secret">{SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL}</Label>
          <Input
            id="kv-secret"
            value={state.keyVaultSecretName}
            onChange={(e) => onStateChange((prev) => ({ ...prev, keyVaultSecretName: e.target.value }))}
            placeholder={SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER}
          />
        </div>
        <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          <li>Protocol: {state.protocol === "oidc" ? "OpenID Connect" : state.protocol === "saml" ? "SAML 2.0" : " — "}</li>
          <li>Issuer: {state.issuerUri}</li>
          <li>Mapped roles (test): {state.mappedRoles.join(", ") || " — "}</li>
        </ul>
        <SsoActivateConsequencePreview />
      </div>
    );
  }

  return null;
}
