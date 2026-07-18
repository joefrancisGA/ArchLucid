"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { HelpDocumentationTopicCard } from "@/components/help/HelpDocumentationTopicCard";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import {
  filterHelpCenterTopicsByQuery,
  listHelpCenterDocumentationTopics,
} from "@/lib/help-center-catalog";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Technical/admin reference topics filtered by `contentKind` (TB-734). */
export function HelpDocumentationGuide(): React.JSX.Element {
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [topicQuery, setTopicQuery] = useState("");

  const documentationTopics = useMemo(() => listHelpCenterDocumentationTopics({ isAdmin }), [isAdmin]);
  const filteredTopics = useMemo(
    () => filterHelpCenterTopicsByQuery(documentationTopics, topicQuery),
    [documentationTopics, topicQuery],
  );

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} aria-labelledby="help-documentation-guide-heading">
      <h2 id="help-documentation-guide-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
        Technical documentation
      </h2>
      <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>
        Configuration keys, CLI usage, API contracts, and admin diagnostics. Each entry is labeled Documentation and
        links to the full reference topic.
      </p>

      <label className={cn("block", OPERATOR_TYPOGRAPHY.navLabel, "text-al-text-primary")} htmlFor="help-documentation-search">
        Search documentation
      </label>
      <input
        id="help-documentation-search"
        type="search"
        value={topicQuery}
        onChange={(event) => {
          setTopicQuery(event.target.value);
        }}
        placeholder="Filter documentation by title or summary"
        className={cn(
          "w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
          OPERATOR_TYPOGRAPHY.body,
        )}
        autoComplete="off"
      />

      {filteredTopics.length === 0 ? (
        <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>No documentation matches your search.</p>
      ) : (
        <ul className="m-0 grid gap-3 sm:grid-cols-2" data-testid="help-documentation-topic-grid">
          {filteredTopics.map((entry) => (
            <HelpDocumentationTopicCard key={entry.slug} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
