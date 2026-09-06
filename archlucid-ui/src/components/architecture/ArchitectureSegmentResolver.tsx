"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { getArchitectureIdentity } from "@/lib/api/architecture-identities-api";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import {
  architectureDraftEditorPath,
  architectureIdentityPath,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import { isApiRequestError } from "@/lib/api-request-error";

type ArchitectureSegmentResolverProps = {
  readonly segmentId: string;
};

type ResolvedView =
  | { readonly kind: "loading" }
  | { readonly kind: "identity-desk"; readonly architectureId: string; readonly displayName: string }
  | { readonly kind: "legacy-draft"; readonly draftId: string }
  | { readonly kind: "not-found" };

export function ArchitectureSegmentResolver(props: ArchitectureSegmentResolverProps): React.JSX.Element {
  const router = useRouter();
  const [view, setView] = useState<ResolvedView>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveSegment(): Promise<void> {
      const segmentId = props.segmentId.trim();

      if (segmentId.length === 0) {
        if (!cancelled) setView({ kind: "not-found" });
        return;
      }

      try {
        const identity = await getArchitectureIdentity(segmentId);

        if (cancelled) return;

        setView({
          kind: "identity-desk",
          architectureId: identity.identity.architectureId,
          displayName: identity.identity.displayName,
        });

        return;
      } catch (identityError) {
        if (!isApiRequestError(identityError) || identityError.httpStatus !== 404) {
          if (!cancelled) setView({ kind: "not-found" });
          return;
        }
      }

      try {
        const draft = await getDraftRequest(segmentId);

        if (cancelled) return;

        if (draft.architectureId) {
          router.replace(architectureDraftEditorPath(draft.architectureId, draft.draftId));
          return;
        }

        setView({ kind: "legacy-draft", draftId: draft.draftId });
      } catch {
        if (!cancelled) setView({ kind: "not-found" });
      }
    }

    void resolveSegment();

    return () => {
      cancelled = true;
    };
  }, [props.segmentId, router]);

  if (view.kind === "loading") {
    return <p className="text-sm text-muted-foreground">Loading architecture…</p>;
  }

  if (view.kind === "not-found") {
    return <p className="text-sm text-destructive">Architecture not found in this workspace.</p>;
  }

  if (view.kind === "legacy-draft") {
    return (
      <div className="mt-6 space-y-4">
        <ArchitectureDraftWorkspace architectureId={view.draftId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{view.displayName}</h1>
        <p className="text-sm text-muted-foreground">Architecture desk — child drafts and reviews for this system.</p>
      </div>
      <ArchitectureIdentityDeskLinks architectureId={view.architectureId} />
    </div>
  );
}

function ArchitectureIdentityDeskLinks(props: { readonly architectureId: string }): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [latestReviewId, setLatestReviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getArchitectureIdentity(props.architectureId)
      .then((identity) => {
        if (cancelled) return;

        setCurrentDraftId(identity.currentDraft?.draftId ?? null);
        setLatestReviewId(identity.reviews[0]?.reviewRunId ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [props.architectureId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading children…</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentDraftId !== null ? (
        <Link
          className="text-sm font-medium text-primary hover:underline"
          href={architectureDraftEditorPath(props.architectureId, currentDraftId)}
        >
          Open current draft
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">No open draft</span>
      )}
      {latestReviewId !== null ? (
        <Link className="text-sm font-medium text-primary hover:underline" href={reviewDetailPath(latestReviewId)}>
          Open latest review
        </Link>
      ) : null}
      <Link className="text-sm text-muted-foreground hover:underline" href={architectureIdentityPath(props.architectureId)}>
        Refresh desk
      </Link>
    </div>
  );
}
