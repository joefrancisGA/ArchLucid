import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

export const JOB_CONTEXT_ORIENTATION_SOURCES_MAX_LINKS = 3;

type JobContextKind =
  | "draft"
  | "review"
  | "governance"
  | "integration"
  | "help"
  | "insights"
  | "administration"
  | "general";

function resolveJobContextKindFromPathname(pathname: string): JobContextKind {
  const normalized = pathname.trim().split("?")[0]?.split("#")[0] ?? "";

  if (normalized.startsWith("/architecture/architectures")) {
    return "draft";
  }

  if (normalized.startsWith("/architecture/reviews")) {
    return "review";
  }

  if (normalized.startsWith("/governance")) {
    return "governance";
  }

  if (normalized.startsWith("/integrations")) {
    return "integration";
  }

  if (normalized.startsWith("/help")) {
    return "help";
  }

  if (normalized.startsWith("/insights")) {
    return "insights";
  }

  if (normalized.startsWith("/administration")) {
    return "administration";
  }

  return "general";
}

function scoreLinkForJobContext(link: EvidenceOrientationLink, jobKind: JobContextKind): number {
  const href = link.href.trim().split("#")[0]?.split("?")[0] ?? link.href.trim();

  if (jobKind === "draft") {
    if (href.startsWith("/architecture/architectures") || href.startsWith("/architecture/reviews/new")) {
      return 100;
    }

    if (href.startsWith("/help/architecture-drafts") || href.includes("architecture-draft")) {
      return 80;
    }
  }

  if (jobKind === "review") {
    if (href.startsWith("/architecture/reviews")) {
      return 100;
    }

    if (href.startsWith("/governance/findings") || href.startsWith("/help/findings")) {
      return 85;
    }
  }

  if (jobKind === "governance") {
    if (href.startsWith("/governance") || href.startsWith("/help/alerts")) {
      return 100;
    }
  }

  if (jobKind === "integration") {
    if (href.startsWith("/integrations") || href.includes("integration")) {
      return 100;
    }
  }

  if (jobKind === "help") {
    if (href.startsWith("/help")) {
      return 100;
    }
  }

  if (jobKind === "insights") {
    if (href.startsWith("/insights")) {
      return 100;
    }
  }

  if (jobKind === "administration") {
    if (href.startsWith("/administration") || href.startsWith("/help/")) {
      return 90;
    }
  }

  if (href.startsWith("/help/getting-started")) {
    return 40;
  }

  return 10;
}

/** Limits Where-to-go-next follow-ups to the most relevant hops for the current job context. */
export function filterOrientationSourcesForJobContext(
  links: readonly EvidenceOrientationLink[],
  pathname: string,
  maxLinks: number = JOB_CONTEXT_ORIENTATION_SOURCES_MAX_LINKS,
): readonly EvidenceOrientationLink[] {
  if (links.length <= maxLinks) {
    return links;
  }

  const jobKind = resolveJobContextKindFromPathname(pathname);

  return [...links]
    .map((link, index) => ({
      link,
      score: scoreLinkForJobContext(link, jobKind),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    })
    .slice(0, maxLinks)
    .map((entry) => entry.link);
}
