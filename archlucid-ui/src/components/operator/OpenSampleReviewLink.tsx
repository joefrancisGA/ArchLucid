"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";

import { visitSampleWorkspaceScope } from "@/lib/operator/operator-scope-actions";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const OPEN_SAMPLE_REVIEW_HREF = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

export type OpenSampleReviewLinkProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly href?: string;
  readonly "data-testid"?: string;
};

/** Switches to the sample workspace before opening the curated sample review. */
export function OpenSampleReviewLink(props: OpenSampleReviewLinkProps): ReactElement {
  const router = useRouter();
  const href = props.href ?? OPEN_SAMPLE_REVIEW_HREF;

  return (
    <Link
      href={href}
      className={props.className}
      data-testid={props["data-testid"]}
      onClick={(event) => {
        event.preventDefault();
        visitSampleWorkspaceScope();
        router.push(href);
      }}
    >
      {props.children}
    </Link>
  );
}
