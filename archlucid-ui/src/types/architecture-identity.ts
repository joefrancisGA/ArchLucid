import type { DraftRequestStatus } from "@/types/draft-intake";

export type ArchitectureIdentityListItem = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly updatedUtc: string;
  readonly currentDraftId?: string | null;
  readonly latestReviewId?: string | null;
  readonly latestSealedManifestId?: string | null;
  readonly draftCount: number;
  readonly reviewCount: number;
  readonly archivedUtc?: string | null;
};

export type ArchitectureIdentityChildDraftSummary = {
  readonly draftId: string;
  readonly status: DraftRequestStatus;
  readonly systemName?: string | null;
  readonly updatedUtc: string;
};

export type ArchitectureIdentityChildReviewSummary = {
  readonly runId: string;
  readonly description?: string | null;
  readonly createdUtc: string;
};

export type ArchitectureIdentityVersionSummary = {
  readonly architectureVersionId: string;
  readonly versionNumber: number;
  readonly createdUtc: string;
  readonly linkedReviewId?: string | null;
};

export type ArchitectureIdentityDetail = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly description?: string | null;
  readonly currentModelId?: string | null;
  readonly latestSealedManifestId?: string | null;
  readonly currentDraftId?: string | null;
  readonly latestReviewId?: string | null;
  readonly draftCount: number;
  readonly reviewCount: number;
  readonly createdUtc: string;
  readonly updatedUtc: string;
  readonly archivedUtc?: string | null;
  readonly drafts: readonly ArchitectureIdentityChildDraftSummary[];
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly versions: readonly ArchitectureIdentityVersionSummary[];
};

export type ArchitectureIdentityListPage = {
  readonly items: readonly ArchitectureIdentityListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly archivedHiddenCount?: number;
};
