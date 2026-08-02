import type { ApiLoadFailureState } from "@/lib/api-load-failure";

import type { RetrievalHit } from "./retrieval-hit";

export type SearchPageViewModel = {
  readonly buyerShell: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly hasSearched: boolean;
  readonly isDemo: boolean;
  readonly loading: boolean;
  readonly onSearch: () => Promise<void>;
  readonly query: string;
  readonly results: RetrievalHit[];
  readonly runId: string;
  readonly setQuery: (next: string) => void;
  readonly setRunId: (next: string) => void;
};
