#!/usr/bin/env python3
"""One-shot writer for MAM artifact preview route files (bracket paths)."""
from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
UI = REPO / "archlucid-ui" / "src"
SECTIONS = (
    UI
    / "app"
    / "(operator)"
    / "signed-records"
    / "[manifestId]"
    / "artifacts"
    / "[artifactId]"
    / "_sections"
)
ARTIFACT_ROUTE = SECTIONS.parent
RUN_ROUTE = UI / "app" / "(operator)" / "reviews" / "[runId]" / "artifacts" / "[artifactId]"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {path.relative_to(REPO)}")


LOADER = r'''import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  fetchArtifactContentUtf8,
  getArtifactDescriptor,
  getManifestSummary,
  listArtifacts,
} from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { prepareArtifactBodyText } from "@/lib/artifact-review-helpers";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  coerceArtifactDescriptor,
  coerceArtifactDescriptorList,
  coerceManifestSummary,
} from "@/lib/operator-response-guards";
import { tryStaticDemoArtifacts, tryStaticDemoManifestSummary } from "@/lib/operator-static-demo";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";
import {
  resolveServerScopeHeadersForManifest,
  resolveServerScopeHeadersForRun,
} from "@/lib/server-run-scope";
import type { ArtifactDescriptor } from "@/types/authority";

import type { SignedRecordArtifactPageSuccessModel } from "./signed-record-artifact-page-model";

export type LoadSignedRecordArtifactPageModelResult =
  | { kind: "not-found" }
  | { kind: "descriptor-error"; buyerPolishedLayout: boolean; failure: ApiLoadFailureState }
  | { kind: "descriptor-malformed"; buyerPolishedLayout: boolean; message: string }
  | { kind: "success"; model: SignedRecordArtifactPageSuccessModel };

function findArtifactInList(
  artifacts: readonly ArtifactDescriptor[],
  artifactId: string,
): ArtifactDescriptor | null {
  const normalized = artifactId.trim();

  return artifacts.find((row) => row.artifactId === normalized) ?? null;
}

/** Loads artifact descriptor, preview body, and sibling list for the signed-record artifact route. */
export async function loadSignedRecordArtifactPageModel(
  manifestId: string,
  artifactId: string,
): Promise<LoadSignedRecordArtifactPageModelResult> {
  if (isInvalidManifestRouteId(manifestId) || isInvalidDynamicRouteToken(artifactId)) {
    return { kind: "not-found" };
  }

  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();
  const serverManifestScopeHeaders = isBrowser() ? null : await resolveServerScopeHeadersForManifest(manifestId);
  const manifestScopeOptions =
    serverManifestScopeHeaders !== null ? { scopeHeaders: serverManifestScopeHeaders } : undefined;

  let summaryRunId: string | null = null;

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId, manifestScopeOptions);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (coercedSummary.ok) {
      summaryRunId = coercedSummary.value.runId.trim();
    }
  } catch {
    const staticSummary = tryStaticDemoManifestSummary(manifestId);

    if (staticSummary !== null) {
      summaryRunId = staticSummary.runId.trim();
    }
  }

  const artifactScopeOptions =
    isBrowser() || summaryRunId === null
      ? manifestScopeOptions
      : { scopeHeaders: await resolveServerScopeHeadersForRun(summaryRunId) };

  let descriptor: ArtifactDescriptor | null = null;
  let descriptorFailure: ApiLoadFailureState | null = null;
  let descriptorMalformed: string | null = null;

  try {
    const rawDescriptor: unknown = await getArtifactDescriptor(manifestId, artifactId);
    const coercedDescriptor = coerceArtifactDescriptor(rawDescriptor);

    if (!coercedDescriptor.ok) {
      descriptorMalformed = coercedDescriptor.message;
    } else {
      descriptor = coercedDescriptor.value;
    }
  } catch (error: unknown) {
    descriptorFailure = toApiLoadFailure(error);
  }

  let siblings: ArtifactDescriptor[] = [];

  try {
    const rawArtifacts: unknown = await listArtifacts(manifestId, artifactScopeOptions);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (coercedArtifacts.ok) {
      siblings = coercedArtifacts.items;
    }
  } catch {
    if (summaryRunId !== null) {
      const staticArtifacts = tryStaticDemoArtifacts(summaryRunId, manifestId);

      if (staticArtifacts !== null) {
        siblings = staticArtifacts;
      }
    }
  }

  if (descriptor === null) {
    descriptor = findArtifactInList(siblings, artifactId);
  }

  if (descriptor === null && summaryRunId !== null && siblings.length === 0) {
    const staticArtifacts = tryStaticDemoArtifacts(summaryRunId, manifestId);

    if (staticArtifacts !== null) {
      siblings = staticArtifacts;
      descriptor = findArtifactInList(staticArtifacts, artifactId);
    }
  }

  if (descriptor === null && descriptorFailure !== null && isApiNotFoundFailure(descriptorFailure)) {
    return { kind: "not-found" };
  }

  if (descriptorFailure !== null && descriptor === null) {
    return {
      kind: "descriptor-error",
      buyerPolishedLayout,
      failure: descriptorFailure,
    };
  }

  if (descriptorMalformed !== null && descriptor === null) {
    return {
      kind: "descriptor-malformed",
      buyerPolishedLayout,
      message: descriptorMalformed,
    };
  }

  if (descriptor === null) {
    return { kind: "not-found" };
  }

  let contentType = "application/octet-stream";
  let byteLength = 0;
  let truncated = false;
  let contentError: string | null = null;
  let prepared = prepareArtifactBodyText("", descriptor.format, descriptor.artifactType);

  try {
    const fetched = await fetchArtifactContentUtf8(manifestId, artifactId);
    contentType = fetched.contentType;
    byteLength = fetched.byteLength;
    truncated = fetched.truncated;
    prepared = prepareArtifactBodyText(fetched.text, descriptor.format, descriptor.artifactType);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    contentError = failure.message ?? uiFailureFromMessage("Artifact content could not be loaded.").message;
  }

  const runId = descriptor.runId?.trim() ?? summaryRunId;

  return {
    kind: "success",
    model: {
      manifestId,
      artifactId,
      buyerPolishedLayout,
      descriptor,
      siblings,
      prepared,
      contentType,
      byteLength,
      truncated,
      contentError,
      runId: runId !== null && runId.length > 0 ? runId : null,
    },
  };
}
'''

MODEL = r'''import type { PreparedArtifactBody } from "@/lib/artifact-review-helpers";
import type { ArtifactDescriptor } from "@/types/authority";

export type SignedRecordArtifactPageSuccessModel = {
  readonly manifestId: string;
  readonly artifactId: string;
  readonly buyerPolishedLayout: boolean;
  readonly descriptor: ArtifactDescriptor;
  readonly siblings: ArtifactDescriptor[];
  readonly prepared: PreparedArtifactBody;
  readonly contentType: string;
  readonly byteLength: number;
  readonly truncated: boolean;
  readonly contentError: string | null;
  readonly runId: string | null;
};
'''

HEADER = r'''"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SIGNED_RECORD_ARTIFACT_ACTION_REFRESH,
  SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING,
  SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX,
  SIGNED_RECORD_ARTIFACT_PAGE_TITLE,
} from "@/lib/signed-record-artifact-page-copy";

export type SignedRecordArtifactPageHeaderProps = {
  readonly subtitle: string;
};

/** Shared signed-record artifact hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function SignedRecordArtifactPageHeader(props: SignedRecordArtifactPageHeaderProps): React.JSX.Element {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    try {
      router.refresh();
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const lastRefreshedLabel =
    lastRefreshedAt === null ? "Not refreshed yet" : lastRefreshedAt.toLocaleString();

  return (
    <OperatorPageHeader
      title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
      titleTestId="signed-record-artifact-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="signed-record-artifact-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="signed-record-artifact-refresh-button"
            disabled={refreshing}
            onClick={() => void onRefresh()}
          >
            {refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : SIGNED_RECORD_ARTIFACT_ACTION_REFRESH}
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="signed-record-artifact-last-refreshed"
        >
          {SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX}:{" "}
          {refreshing ? SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
'''

VIEW = r'''"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ArtifactReviewContent } from "@/components/ArtifactReviewContent";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArtifactDownloadUrl } from "@/lib/api";
import {
  getArtifactDisplayLabel,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
} from "@/lib/artifact-review-helpers";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SIGNED_RECORD_ARTIFACT_SCOPE_DETAILS_TRIGGER,
  SIGNED_RECORD_ARTIFACT_SCOPE_OVERVIEW,
  SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING,
  SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING,
  signedRecordArtifactPageSubtitle,
} from "@/lib/signed-record-artifact-page-copy";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import { SignedRecordArtifactPageHeader } from "./SignedRecordArtifactPageHeader";
import type { SignedRecordArtifactPageSuccessModel } from "./signed-record-artifact-page-model";

type SignedRecordArtifactPageViewProps = {
  readonly model: SignedRecordArtifactPageSuccessModel;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Buyer-safe artifact preview for `/signed-records/[manifestId]/artifacts/[artifactId]`. */
export function SignedRecordArtifactPageView(props: SignedRecordArtifactPageViewProps): React.JSX.Element {
  const model = props.model;
  const buyerPolishedLayout = model.buyerPolishedLayout;
  const displayLabel = getArtifactDisplayLabel({
    artifactId: model.descriptor.artifactId,
    artifactType: model.descriptor.artifactType,
  });

  return (
    <div className="w-full max-w-[1200px] space-y-6 px-1 py-2 sm:px-0" data-testid="signed-record-artifact-page">
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/signed-records">
          Signed review records
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(model.manifestId)}>
          Signed record
        </Link>
        {model.runId !== null ? (
          <>
            {" · "}
            <Link className={OPERATOR_LINK.nav} href={`/reviews/${encodeURIComponent(model.runId)}`}>
              Open review
            </Link>
          </>
        ) : null}
        {" · "}
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} aria-current="page">
          {displayLabel}
        </span>
      </nav>

      <SignedRecordArtifactPageHeader subtitle={signedRecordArtifactPageSubtitle(buyerPolishedLayout)} />

      {buyerPolishedLayout ? (
        <CollapsibleSection
          title={SIGNED_RECORD_ARTIFACT_SCOPE_DETAILS_TRIGGER}
          defaultOpen={false}
          sectionTestId="signed-record-artifact-scope-details"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="signed-record-artifact-scope-overview">
            {SIGNED_RECORD_ARTIFACT_SCOPE_OVERVIEW}
          </p>
        </CollapsibleSection>
      ) : null}

      <Card data-testid="signed-record-artifact-metadata-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING}</CardTitle>
          <CardDescription>{getArtifactTypeDescription(model.descriptor.artifactType)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Output</dt>
              <dd className="m-0 mt-1 font-medium text-al-text-primary">{displayLabel}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Format</dt>
              <dd className="m-0 mt-1">{getArtifactFormatLabel(model.descriptor.format)}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Generated</dt>
              <dd className="m-0 mt-1">{formatDate(model.descriptor.createdUtc)}</dd>
            </div>
            <div>
              <dt className={OPERATOR_TYPOGRAPHY.label}>Content hash</dt>
              <dd className="m-0 mt-1 font-mono text-sm break-all">{model.descriptor.contentHash}</dd>
            </div>
          </dl>
          <ExportTrackedAnchor href={getArtifactDownloadUrl(model.manifestId, model.artifactId)}>
            Download artifact
          </ExportTrackedAnchor>
        </CardContent>
      </Card>

      <section aria-labelledby="signed-record-artifact-preview-heading" className="space-y-3">
        <h2 id="signed-record-artifact-preview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Preview
        </h2>
        <ArtifactReviewContent
          prepared={model.prepared}
          contentType={model.contentType}
          byteLength={model.byteLength}
          truncated={model.truncated}
          contentError={model.contentError}
        />
      </section>

      {model.siblings.length > 0 ? (
        <section aria-labelledby="signed-record-artifact-siblings-heading" className="space-y-3">
          <h2 id="signed-record-artifact-siblings-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING}
          </h2>
          <ArtifactListTable
            manifestId={model.manifestId}
            artifacts={model.siblings}
            currentArtifactId={model.artifactId}
            runId={model.runId ?? undefined}
            sponsorMode={buyerPolishedLayout}
          />
        </section>
      ) : null}
    </div>
  );
}
'''

PAGE = r'''import { notFound } from "next/navigation";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { OperatorMalformedCallout } from "@/components/OperatorShellMessage";
import { isInvalidDynamicRouteToken, isInvalidManifestRouteId } from "@/lib/route-dynamic-param";

import { loadSignedRecordArtifactPageModel } from "./_sections/load-signed-record-artifact-page-model";
import { SignedRecordArtifactPageView } from "./_sections/SignedRecordArtifactPageView";

/** Server signed-record artifact preview route (MAM). */
export default async function SignedRecordArtifactPage({
  params,
}: {
  params: Promise<{ manifestId: string; artifactId: string }>;
}): Promise<React.ReactElement> {
  const { manifestId, artifactId } = await params;

  if (isInvalidManifestRouteId(manifestId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  const result = await loadSignedRecordArtifactPageModel(manifestId, artifactId);

  if (result.kind === "not-found") {
    return (
      <div className="w-full max-w-[1200px] px-1 py-2 sm:px-0">
        <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading artifact" />
      </div>
    );
  }

  if (result.kind === "descriptor-error") {
    return (
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
        <OperatorApiProblem failure={result.failure} />
      </div>
    );
  }

  if (result.kind === "descriptor-malformed") {
    return (
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
        <OperatorMalformedCallout message={result.message} />
      </div>
    );
  }

  return <SignedRecordArtifactPageView model={result.model} />;
}
'''

LOADING = r'''import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_RECORD_ARTIFACT_PAGE_TITLE } from "@/lib/signed-record-artifact-page-copy";

export default function SignedRecordArtifactLoading(): React.JSX.Element {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-6 sm:px-0"
      data-testid="signed-record-artifact-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/signed-records">
          Signed review records
        </Link>
      </nav>
      <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGNED_RECORD_ARTIFACT_PAGE_TITLE}</h1>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading artifact preview…</p>
    </div>
  );
}
'''

RUN_PAGE = r'''import { notFound, permanentRedirect } from "next/navigation";

import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/** Run-scoped artifact preview resolves to canonical signed-record artifact URL (RER → MAM). */
export default async function RunArtifactPreviewRedirectPage({
  params,
}: {
  params: Promise<{ runId: string; artifactId: string }>;
}): Promise<never> {
  const { runId, artifactId } = await params;

  if (isInvalidDynamicRouteToken(runId) || isInvalidDynamicRouteToken(artifactId)) {
    notFound();
  }

  const manifestId = await resolveGoldenManifestIdForRun(runId);

  if (manifestId === null) {
    notFound();
  }

  permanentRedirect(signedRecordArtifactPath(manifestId, artifactId));
}
'''

HEADER_TEST = r'''import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { signedRecordArtifactPageSubtitle } from "@/lib/signed-record-artifact-page-copy";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/signed-records/manifest-1/artifacts/artifact-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SignedRecordArtifactPageHeader } from "@/app/(operator)/signed-records/[manifestId]/artifacts/[artifactId]/_sections/SignedRecordArtifactPageHeader";

describe("SignedRecordArtifactPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata", () => {
    refresh.mockReset();

    render(<SignedRecordArtifactPageHeader subtitle={signedRecordArtifactPageSubtitle(false)} />);

    expect(screen.getByRole("heading", { level: 1, name: "Artifact preview" })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("signed-record-artifact-refresh-button"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
'''

BUYER_TEST = r'''import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/signed-records/manifest-1/artifacts/artifact-1",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SignedRecordArtifactPageView } from "@/app/(operator)/signed-records/[manifestId]/artifacts/[artifactId]/_sections/SignedRecordArtifactPageView";
import {
  BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  SIGNED_RECORD_ARTIFACT_SCOPE_OVERVIEW,
} from "@/lib/signed-record-artifact-page-copy";
import type { SignedRecordArtifactPageSuccessModel } from "@/app/(operator)/signed-records/[manifestId]/artifacts/[artifactId]/_sections/signed-record-artifact-page-model";

const model: SignedRecordArtifactPageSuccessModel = {
  manifestId: "11111111-1111-4111-8111-111111111111",
  artifactId: "cost-summary",
  buyerPolishedLayout: true,
  descriptor: {
    artifactId: "cost-summary",
    artifactType: "CostSummary",
    name: "cost-summary.json",
    format: "json",
    createdUtc: "2026-07-01T12:00:00.000Z",
    contentHash: "abc123",
    manifestId: "11111111-1111-4111-8111-111111111111",
    runId: "22222222-2222-4222-8222-222222222222",
  },
  siblings: [],
  prepared: {
    viewKind: "json",
    readableText: "{\n  \"total\": 1\n}\n",
    rawText: "{\"total\":1}",
    jsonPrettyFailed: false,
  },
  contentType: "application/json",
  byteLength: 12,
  truncated: false,
  contentError: null,
  runId: "22222222-2222-4222-8222-222222222222",
};

describe("SignedRecordArtifactPageView buyer-polished shell", () => {
  it("uses buyer subtitle, refresh, and collapsed scope copy", () => {
    render(<SignedRecordArtifactPageView model={model} />);

    expect(screen.getByText(BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-scope-details")).toBeInTheDocument();
    expect(screen.getByTestId("signed-record-artifact-scope-overview")).toHaveTextContent(
      SIGNED_RECORD_ARTIFACT_SCOPE_OVERVIEW,
    );
  });
});
'''

EXISTENCE_TEST = r'''import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("artifact preview App Router existence (TB-1825 / MAM)", () => {
  it("has physical pages for manifest-scoped and run-scoped artifact preview entry points", () => {
    const appRoot = join(process.cwd(), "src", "app", "(operator)");
    const mamPage = join(
      appRoot,
      "signed-records",
      "[manifestId]",
      "artifacts",
      "[artifactId]",
      "page.tsx",
    );
    const rerPage = join(appRoot, "reviews", "[runId]", "artifacts", "[artifactId]", "page.tsx");

    expect(existsSync(mamPage)).toBe(true);
    expect(existsSync(rerPage)).toBe(true);
  });
});
'''


def main() -> None:
    write(SECTIONS / "signed-record-artifact-page-model.ts", MODEL)
    write(SECTIONS / "load-signed-record-artifact-page-model.ts", LOADER)
    write(SECTIONS / "SignedRecordArtifactPageHeader.tsx", HEADER)
    write(SECTIONS / "SignedRecordArtifactPageView.tsx", VIEW)
    write(SECTIONS / "SignedRecordArtifactPageHeader.test.tsx", HEADER_TEST)
    write(ARTIFACT_ROUTE / "page.tsx", PAGE)
    write(ARTIFACT_ROUTE / "loading.tsx", LOADING)
    write(RUN_ROUTE / "page.tsx", RUN_PAGE)
    write(UI / "app" / "(operator)" / "signed-records" / "[manifestId]" / "artifacts" / "[artifactId]" / "SignedRecordArtifactPageView.buyer-polished.test.tsx", BUYER_TEST)
    write(UI / "lib" / "artifact-preview-route-existence.test.ts", EXISTENCE_TEST)


if __name__ == "__main__":
    main()
