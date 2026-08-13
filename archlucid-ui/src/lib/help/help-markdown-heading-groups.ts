import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";

export type HelpMarkdownHeadingGroup = {
  readonly section: HelpMarkdownHeading;
  readonly children: readonly HelpMarkdownHeading[];
};

/** Groups flat `##` / `###` headings into parent sections for hierarchical reference navigation. */
export function groupHelpMarkdownHeadings(
  headings: readonly HelpMarkdownHeading[],
): readonly HelpMarkdownHeadingGroup[] {
  const groups: HelpMarkdownHeadingGroup[] = [];
  let currentGroup: HelpMarkdownHeadingGroup | null = null;

  for (const heading of headings) {
    if (heading.level === 2) {
      currentGroup = { section: heading, children: [] };
      groups.push(currentGroup);
      continue;
    }

    if (heading.level === 3 && currentGroup !== null) {
      currentGroup = {
        section: currentGroup.section,
        children: [...currentGroup.children, heading],
      };
      groups[groups.length - 1] = currentGroup;
    }
  }

  return groups;
}

function normalizeReferenceSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function headingMatchesQuery(heading: HelpMarkdownHeading, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const haystack = `${heading.title} ${heading.id}`.toLowerCase();

  return haystack.includes(normalizedQuery);
}

export type FilteredHelpMarkdownHeadingGroups = {
  readonly groups: readonly HelpMarkdownHeadingGroup[];
  readonly matchCount: number;
};

/** Filters hierarchical groups by section title, child title, or slug fragment. */
export function filterHelpMarkdownHeadingGroups(
  groups: readonly HelpMarkdownHeadingGroup[],
  query: string,
): FilteredHelpMarkdownHeadingGroups {
  const normalizedQuery = normalizeReferenceSearchQuery(query);

  if (normalizedQuery.length === 0) {
    const matchCount = groups.reduce((count, group) => count + 1 + group.children.length, 0);

    return { groups, matchCount };
  }

  const filteredGroups: HelpMarkdownHeadingGroup[] = [];
  let matchCount = 0;

  for (const group of groups) {
    const sectionMatches = headingMatchesQuery(group.section, normalizedQuery);
    const matchingChildren = group.children.filter((child) => headingMatchesQuery(child, normalizedQuery));

    if (!sectionMatches && matchingChildren.length === 0) {
      continue;
    }

    const nextChildren = sectionMatches ? group.children : matchingChildren;

    matchCount += sectionMatches ? 1 + matchingChildren.length : matchingChildren.length;
    filteredGroups.push({
      section: group.section,
      children: nextChildren,
    });
  }

  return { groups: filteredGroups, matchCount };
}

/** Flattens grouped headings for scroll-spy and anchor parity with the markdown body. */
export function flattenHelpMarkdownHeadingGroups(
  groups: readonly HelpMarkdownHeadingGroup[],
): readonly HelpMarkdownHeading[] {
  const flattened: HelpMarkdownHeading[] = [];

  for (const group of groups) {
    flattened.push(group.section);
    flattened.push(...group.children);
  }

  return flattened;
}
