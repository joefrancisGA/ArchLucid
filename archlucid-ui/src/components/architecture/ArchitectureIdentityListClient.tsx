"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { listArchitectureIdentities } from "@/lib/api/architecture-identities-api";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { isApiRequestError } from "@/lib/api-request-error";

export function ArchitectureIdentityListClient(): React.JSX.Element {
  const query = useQuery({
    queryKey: ["architecture-identities", "list"],
    queryFn: () => listArchitectureIdentities({ page: 1, pageSize: 50 }),
  });

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading architectures…</p>;
  }

  if (query.isError) {
    const message = isApiRequestError(query.error)
      ? query.error.message
      : "Could not load architecture identities.";

    return <p className="text-sm text-destructive">{message}</p>;
  }

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No architecture identities yet. Start a draft to create your first named system.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing {items.length} of {totalCount} architecture{totalCount === 1 ? "" : "s"}
      </p>
      <ul className="divide-y rounded-md border">
        {items.map((item) => (
          <li key={item.architectureId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <Link
                className="font-medium text-primary hover:underline"
                href={architectureIdentityPath(item.architectureId)}
              >
                {item.displayName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {item.childPointers.draftCount} draft{item.childPointers.draftCount === 1 ? "" : "s"} ·{" "}
                {item.childPointers.reviewCount} review{item.childPointers.reviewCount === 1 ? "" : "s"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(item.updatedUtc).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
