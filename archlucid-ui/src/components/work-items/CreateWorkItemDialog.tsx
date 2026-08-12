"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createItsmOutboundIssue,
  listItsmFindingCorrelations,
  type ItsmFindingCorrelationListItem,
} from "@/lib/api/itsm-outbound-api";
import {
  buildArchitectureWorkItemClipboardBody,
  clipboardFormatForItsmProvider,
  type ArchitectureWorkItemPreview,
} from "@/lib/architecture/architecture-work-item-model";
import { writeWorkItemBodyToClipboard } from "@/lib/copy-finding-as-work-item";
import {
  CREATE_WORK_ITEM_API_FAILURE,
  CREATE_WORK_ITEM_CONFIGURE_CTA,
  CREATE_WORK_ITEM_COPY_LABEL,
  CREATE_WORK_ITEM_DIALOG_DESCRIPTION,
  CREATE_WORK_ITEM_DIALOG_TITLE,
  CREATE_WORK_ITEM_FIELD_DESCRIPTION,
  CREATE_WORK_ITEM_FIELD_FINDINGS,
  CREATE_WORK_ITEM_FIELD_OWNER,
  CREATE_WORK_ITEM_FIELD_PRIORITY,
  CREATE_WORK_ITEM_FIELD_SOURCE,
  CREATE_WORK_ITEM_FIELD_TITLE,
  CREATE_WORK_ITEM_INVALID_CONNECTION,
  CREATE_WORK_ITEM_NATIVE_SUBMIT_LABEL,
  CREATE_WORK_ITEM_NATIVE_SUCCESS,
  CREATE_WORK_ITEM_NO_FINDING_FOR_NATIVE,
  CREATE_WORK_ITEM_NO_PROVIDER_AUTHORIZED,
  CREATE_WORK_ITEM_NO_PROVIDER_UNAUTHORIZED,
  CREATE_WORK_ITEM_PREVIEW_TITLE,
  CREATE_WORK_ITEM_PROVIDER_LABEL,
} from "@/lib/create-work-item-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  canNativeCreateWithItsmProvider,
  configuredItsmWorkItemProviders,
  findItsmWorkItemProviderSnapshot,
  hasAnyItsmWorkItemProviderConfigured,
  isItsmWorkItemProviderConfigured,
  isItsmWorkItemProviderReady,
  resolveItsmWorkItemProviderSnapshots,
  selectSingleConfiguredItsmWorkItemProvider,
  type ItsmWorkItemProvider,
} from "@/lib/itsm/itsm-work-item-provider-state";
import { useItsmNativeCreateReadiness } from "@/lib/use-itsm-native-create-enabled";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { showError, showSuccess } from "@/lib/toast";

export type CreateWorkItemDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly runId: string;
  readonly preview: ArchitectureWorkItemPreview;
  readonly nativeCreateFindingId: string | null;
};

function isProviderLinked(
  correlations: readonly ItsmFindingCorrelationListItem[],
  provider: ItsmWorkItemProvider,
): boolean {
  return correlations.some((correlation) => correlation.provider === provider);
}

function WorkItemPreviewPanel(props: { readonly preview: ArchitectureWorkItemPreview }): React.JSX.Element {
  const { preview } = props;

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="create-work-item-preview"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {CREATE_WORK_ITEM_PREVIEW_TITLE}
      </p>
      <dl className="m-0 space-y-2">
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_TITLE}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{preview.title}</dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_DESCRIPTION}
          </dt>
          <dd className={cn("m-0 whitespace-pre-wrap text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {preview.description}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_PRIORITY}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{preview.priority}</dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_OWNER}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{preview.owner}</dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_FINDINGS}
          </dt>
          <dd className={cn("m-0 space-y-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {preview.findingsIncluded.length === 0 ? (
              <span className="text-al-text-secondary">No findings recorded yet.</span>
            ) : (
              preview.findingsIncluded.map((finding) => (
                <p key={finding.findingId} className="m-0">
                  <span className="font-medium">[{finding.severityLabel}]</span> {finding.title}
                </p>
              ))
            )}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {CREATE_WORK_ITEM_FIELD_SOURCE}
          </dt>
          <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <a href={preview.sourceArchitectureLink} className="text-al-accent underline">
              {preview.sourceArchitectureLink}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Provider-neutral work-item dialog with preview, clipboard export, and optional native ITSM create. */
export function CreateWorkItemDialog(props: CreateWorkItemDialogProps): React.JSX.Element {
  const readiness = useItsmNativeCreateReadiness();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureIntegrations = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const providerSnapshots = useMemo(
    () => resolveItsmWorkItemProviderSnapshots(readiness.health),
    [readiness.health],
  );
  const configuredProviders = useMemo(
    () => configuredItsmWorkItemProviders(providerSnapshots),
    [providerSnapshots],
  );
  const hasConfiguredProvider = hasAnyItsmWorkItemProviderConfigured(providerSnapshots);

  const [provider, setProvider] = useState<ItsmWorkItemProvider>("Jira");
  const [correlations, setCorrelations] = useState<ItsmFindingCorrelationListItem[]>([]);
  const [correlationsLoaded, setCorrelationsLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadCorrelations = useCallback(async (): Promise<void> => {
    if (props.nativeCreateFindingId === null) {
      setCorrelations([]);
      setCorrelationsLoaded(true);

      return;
    }

    const body = await listItsmFindingCorrelations(props.nativeCreateFindingId);
    setCorrelations(body.correlations ?? []);
    setCorrelationsLoaded(true);
  }, [props.nativeCreateFindingId]);

  useEffect(() => {
    if (!props.open) {
      return undefined;
    }

    setErrorMessage(null);

    const singleConfigured = selectSingleConfiguredItsmWorkItemProvider(providerSnapshots);

    if (singleConfigured !== null) {
      setProvider(singleConfigured);
    }

    let cancelled = false;

    void (async () => {
      try {
        await reloadCorrelations();
      } catch {
        if (!cancelled) {
          setCorrelationsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.open, providerSnapshots, reloadCorrelations]);

  const selectedSnapshot = findItsmWorkItemProviderSnapshot(providerSnapshots, provider);
  const selectedProviderConfigured = selectedSnapshot !== null && isItsmWorkItemProviderConfigured(selectedSnapshot);
  const selectedProviderReady =
    selectedSnapshot !== null
    && isItsmWorkItemProviderReady(selectedSnapshot)
    && canNativeCreateWithItsmProvider(readiness.health, provider);
  const selectedProviderInvalid =
    selectedSnapshot?.state === "invalidConnection" || selectedSnapshot?.state === "deploymentDisabled";
  const providerLinked =
    props.nativeCreateFindingId !== null && isProviderLinked(correlations, provider);
  const canSubmitNativeCreate =
    props.nativeCreateFindingId !== null
    && selectedProviderReady
    && !providerLinked
    && correlationsLoaded;

  async function onCopyWorkItem(): Promise<void> {
    if (!selectedProviderConfigured) {
      return;
    }

    setCopyBusy(true);
    setErrorMessage(null);

    try {
      const format = clipboardFormatForItsmProvider(provider);
      const body = buildArchitectureWorkItemClipboardBody(format, props.preview);
      const copied = await writeWorkItemBodyToClipboard(body);

      if (!copied) {
        showError("Could not copy to clipboard");

        return;
      }

      showSuccess("Work item copied to clipboard");
    } finally {
      setCopyBusy(false);
    }
  }

  async function onCreateLinkedWorkItem(): Promise<void> {
    if (props.nativeCreateFindingId === null) {
      setErrorMessage(CREATE_WORK_ITEM_NO_FINDING_FOR_NATIVE);

      return;
    }

    if (!selectedProviderReady) {
      setErrorMessage(CREATE_WORK_ITEM_INVALID_CONNECTION);

      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const created = await createItsmOutboundIssue(props.nativeCreateFindingId, provider);
      showSuccess(`${CREATE_WORK_ITEM_NATIVE_SUCCESS}: ${created.externalKey ?? created.provider}`);
      await reloadCorrelations();
      props.onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : CREATE_WORK_ITEM_API_FAILURE;
      setErrorMessage(message.length > 0 ? message : CREATE_WORK_ITEM_API_FAILURE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="create-work-item-dialog">
        <DialogHeader>
          <DialogTitle>{CREATE_WORK_ITEM_DIALOG_TITLE}</DialogTitle>
          <DialogDescription>{CREATE_WORK_ITEM_DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        {!hasConfiguredProvider ? (
          <div className="space-y-3" data-testid="create-work-item-unconfigured">
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {canConfigureIntegrations
                ? CREATE_WORK_ITEM_NO_PROVIDER_AUTHORIZED
                : CREATE_WORK_ITEM_NO_PROVIDER_UNAUTHORIZED}
            </p>
            {canConfigureIntegrations ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={ITSM_CONNECTORS_ADMIN_PATH} data-testid="create-work-item-configure-link">
                  {CREATE_WORK_ITEM_CONFIGURE_CTA}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {configuredProviders.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="create-work-item-provider">{CREATE_WORK_ITEM_PROVIDER_LABEL}</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => {
                    setProvider(value as ItsmWorkItemProvider);
                    setErrorMessage(null);
                  }}
                >
                  <SelectTrigger id="create-work-item-provider" data-testid="create-work-item-provider-select">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuredProviders.map((entry) => (
                      <SelectItem key={entry.provider} value={entry.provider}>
                        {entry.provider}
                        {entry.state === "invalidConnection" ? " (connection issue)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="create-work-item-single-provider">
                Provider: {provider}
              </p>
            )}

            {selectedProviderInvalid ? (
              <p
                className={cn("m-0 text-amber-800 dark:text-amber-300", OPERATOR_TYPOGRAPHY.body)}
                role="status"
                data-testid="create-work-item-invalid-connection"
              >
                {CREATE_WORK_ITEM_INVALID_CONNECTION}
                {selectedSnapshot?.summary ? ` ${selectedSnapshot.summary}` : ""}
              </p>
            ) : null}

            <WorkItemPreviewPanel preview={props.preview} />

            {errorMessage ? (
              <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy || copyBusy}
            onClick={() => {
              props.onOpenChange(false);
            }}
          >
            Close
          </Button>
          {hasConfiguredProvider ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || copyBusy || !selectedProviderConfigured}
                onClick={() => {
                  void onCopyWorkItem();
                }}
                data-testid="create-work-item-copy"
              >
                {copyBusy ? "Copying…" : CREATE_WORK_ITEM_COPY_LABEL}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || copyBusy || !canSubmitNativeCreate}
                onClick={() => {
                  void onCreateLinkedWorkItem();
                }}
                data-testid="create-work-item-native-submit"
              >
                {busy ? "Creating…" : CREATE_WORK_ITEM_NATIVE_SUBMIT_LABEL}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
