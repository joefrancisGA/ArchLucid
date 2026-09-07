"use client";

import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseSamlSpAdvancedSettingsOpenFromSearch,
  samlSpAdvancedSettingsDisclosureHrefFromSearch,
} from "@/lib/administration/saml-sp-advanced-settings-disclosure-url";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import {
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES,
  IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_SEMANTICS_HELPER,
  IDENTITY_PROVIDERS_SAML_ADVANCED_SETTINGS_TITLE,
  IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL,
  IDENTITY_PROVIDERS_SAML_MAPPING_ADD_ROW,
  IDENTITY_PROVIDERS_SAML_MAPPING_REMOVE_ROW,
  IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL,
} from "@/lib/identity-providers-settings-copy";
import {
  addSamlSpClaimMappingRow,
  removeSamlSpClaimMappingRow,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";
import type { resolveSamlSpConfigurationFieldErrors } from "@/lib/saml-sp-configuration-form-state";

const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

function resolveRoleMappingPlaceholder(archLucidRole: string): string {
  const example = IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES.find((row) => row.archLucidRole === archLucidRole);

  return example?.idpValue ?? "e.g. archlucid-admins";
}

type SamlSpConfigurationTouchedFields = {
  readonly issuerUri: boolean;
  readonly roleClaimName: boolean;
  readonly mappings: boolean;
};

type SamlSpClaimMappingsFieldsProps = {
  readonly values: SamlSpConfigurationFormValues;
  readonly setValues: Dispatch<SetStateAction<SamlSpConfigurationFormValues>>;
  readonly touchedFields: SamlSpConfigurationTouchedFields;
  readonly setTouchedFields: Dispatch<SetStateAction<SamlSpConfigurationTouchedFields>>;
  readonly fieldErrors: ReturnType<typeof resolveSamlSpConfigurationFieldErrors>;
  readonly discoveredClaimNames: readonly string[];
};

export function SamlSpClaimMappingsFields(props: SamlSpClaimMappingsFieldsProps) {
  const { values, setValues, touchedFields, setTouchedFields, fieldErrors, discoveredClaimNames } = props;
  const { localize } = useLocalizedProductCopy();
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/identity-providers";
  const searchParams = useSearchParams();
  const samlSpAdvancedSettingsOpenParam = searchParams.get("samlSpAdvancedSettingsOpen");
  const [advancedSettingsOpen, setAdvancedSettingsOpenState] = useState(() =>
    parseSamlSpAdvancedSettingsOpenFromSearch(samlSpAdvancedSettingsOpenParam),
  );

  const syncAdvancedSettingsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(samlSpAdvancedSettingsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setAdvancedSettingsOpen = useCallback(
    (open: boolean) => {
      setAdvancedSettingsOpenState(open);
      syncAdvancedSettingsOpenToUrl(open);
    },
    [syncAdvancedSettingsOpenToUrl],
  );

  useEffect(() => {
    setAdvancedSettingsOpenState(parseSamlSpAdvancedSettingsOpenFromSearch(samlSpAdvancedSettingsOpenParam));
  }, [samlSpAdvancedSettingsOpenParam]);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="saml-role-claim">{IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL}</Label>
        <Input
          id="saml-role-claim"
          list="saml-discovered-claim-names"
          data-testid="saml-role-claim"
          value={values.roleClaimName}
          onChange={(e) => {
            setValues((prev) => ({ ...prev, roleClaimName: e.target.value }));
          }}
          onBlur={() => {
            setTouchedFields((prev) => ({ ...prev, roleClaimName: true }));
          }}
          aria-invalid={touchedFields.roleClaimName && fieldErrors.roleClaimName !== null ? true : undefined}
          aria-describedby={
            touchedFields.roleClaimName && fieldErrors.roleClaimName !== null ? "saml-role-claim-error" : undefined
          }
          placeholder="groups"
        />
        {touchedFields.roleClaimName && fieldErrors.roleClaimName !== null ? (
          <p
            id="saml-role-claim-error"
            className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
            role="alert"
            data-testid="saml-role-claim-error"
          >
            {fieldErrors.roleClaimName}
          </p>
        ) : null}
        <datalist id="saml-discovered-claim-names">
          {discoveredClaimNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{localize(IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER)}</p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="saml-role-mapping-semantics">
        {localize(IDENTITY_PROVIDERS_ROLE_MAPPING_SEMANTICS_HELPER)}
      </p>

      <EnterpriseTable ariaLabel="SAML claim role mappings" className={OPERATOR_TYPOGRAPHY.body} data-testid="saml-claim-mapping-table">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
            <EnterpriseTableHeaderCell className="py-2 pr-2">IdP group / role value</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="py-2 pr-2">{localize("ArchLucid role")}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="py-2">
              <span className="sr-only">Row actions</span>
            </EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {values.mappings.map((row, index) => (
            <EnterpriseTableRow key={row.rowId}>
              <EnterpriseTableCell className="py-2 pr-2">
                <Input
                  value={row.idpValue}
                  onChange={(e) => {
                    const idpValue = e.target.value;

                    setValues((prev) => {
                      const mappings = [...prev.mappings];
                      mappings[index] = { ...mappings[index], idpValue };

                      return { ...prev, mappings };
                    });
                  }}
                  onBlur={() => {
                    setTouchedFields((prev) => ({ ...prev, mappings: true }));
                  }}
                  placeholder={resolveRoleMappingPlaceholder(row.archLucidRole)}
                  data-testid={`saml-mapping-idp-${row.rowId}`}
                  aria-label={`IdP group or role value for mapping ${index + 1}`}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell className="py-2 pr-2">
                <Select
                  value={row.archLucidRole}
                  onValueChange={(archLucidRole) => {
                    setValues((prev) => {
                      const mappings = [...prev.mappings];
                      mappings[index] = { ...mappings[index], archLucidRole };

                      return { ...prev, mappings };
                    });
                  }}
                >
                  <SelectTrigger
                    className="h-9 w-full"
                    aria-label={`ArchLucid role for mapping ${index + 1}`}
                    data-testid={`saml-mapping-role-${row.rowId}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARCHLUCID_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EnterpriseTableCell>
              <EnterpriseTableCell className="py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={values.mappings.length <= 1}
                  onClick={() => {
                    setValues((prev) => removeSamlSpClaimMappingRow(prev, row.rowId));
                  }}
                  data-testid={`saml-mapping-remove-${row.rowId}`}
                  aria-label={`Remove mapping ${index + 1}`}
                >
                  {IDENTITY_PROVIDERS_SAML_MAPPING_REMOVE_ROW}
                </Button>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>

      {touchedFields.mappings && fieldErrors.mappings !== null ? (
        <p
          className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
          role="alert"
          data-testid="saml-mapping-table-error"
        >
          {fieldErrors.mappings}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setValues((prev) => addSamlSpClaimMappingRow(prev));
        }}
        data-testid="saml-mapping-add-row"
      >
        {IDENTITY_PROVIDERS_SAML_MAPPING_ADD_ROW}
      </Button>

      <details
        className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        data-testid="saml-advanced-settings"
        open={advancedSettingsOpen}
        onToggle={(event) => {
          setAdvancedSettingsOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {IDENTITY_PROVIDERS_SAML_ADVANCED_SETTINGS_TITLE}
        </summary>
        <div className="mt-4 space-y-2">
          <Label htmlFor="saml-group-regex">{IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL}</Label>
          <Input
            id="saml-group-regex"
            data-testid="saml-group-regex"
            value={values.customGroupClaimRegex}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, customGroupClaimRegex: e.target.value }));
            }}
            placeholder="^AL-(Admin|Operator)-.*$"
          />
        </div>
      </details>
    </>
  );
}
