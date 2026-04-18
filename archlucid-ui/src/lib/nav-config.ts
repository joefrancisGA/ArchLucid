import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  FileSearch,
  GitBranch,
  GitCompare,
  GitGraph,
  Home,
  LayoutDashboard,
  ListOrdered,
  Mail,
  MessageSquare,
  Play,
  Rocket,
  Scale,
  Search,
  Shield,
  Sparkles,
  Tags,
  Wrench,
} from "lucide-react";

import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";

import type { RequiredAuthority } from "@/lib/nav-authority";
import type { NavTier } from "@/lib/nav-tier";

export type NavLinkItem = {
  href: string;
  label: string;
  title: string;
  /** Progressive disclosure: essential always; extended after “Show more”; advanced after gear toggle. */
  tier: NavTier;
  /**
   * Optional minimum API policy tier this destination assumes (see `ArchLucidPolicies` on the server).
   * Omitted for Core Pilot breadth and for pages that are intentionally not role-gated in nav yet.
   */
  requiredAuthority?: RequiredAuthority;
  /** Registry combo for `aria-keyshortcuts`, e.g. `alt+n` */
  keyShortcut?: string;
  /** Optional icon for sidebar and mobile drawer. */
  icon?: LucideIcon;
};

export type NavGroupConfig = {
  id: string;
  label: string;
  /** One line under the group title — what this layer is for (see docs/OPERATOR_DECISION_GUIDE.md). */
  caption?: string;
  links: NavLinkItem[];
};

function navTitleWithShortcut(baseTitle: string, registryCombo: string): string {
  const aria = registryKeyToAriaKeyShortcuts(registryCombo);

  return `${baseTitle} (${aria})`;
}

/**
 * Canonical operator shell navigation — sidebar, command palette, and mobile drawer.
 *
 * Nav groups map to product packaging layers (see docs/PRODUCT_PACKAGING.md):
 *   runs-review    → Core Pilot        (request · run · commit · review)
 *   qa-advisory    → Advanced Analysis (compare, replay, graph, provenance, advisory)
 *   alerts-governance → Enterprise Controls (governance, audit, policy, compliance)
 *
 * **Authority:** optional `requiredAuthority` aligns with API `ReadAuthority` / `ExecuteAuthority` / `AdminAuthority`
 * (see `README.md` and `@/lib/nav-authority`). Omitted on Core Pilot essentials so the default path stays visible;
 * Advanced Analysis and Enterprise Controls use it to trim operator/admin surfaces for lower ranks (composed in
 * `@/lib/nav-shell-visibility`).
 *
 * Group IDs are intentionally stable (used as localStorage keys); only labels are user-visible.
 */
export const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: "runs-review",
    // Product layer: Core Pilot
    label: "Core Pilot",
    caption: "Default path — request through commit and artifact review.",
    links: [
      {
        href: "/",
        label: "Home",
        title: navTitleWithShortcut("Home — V1 checklist and quick links", "alt+h"),
        keyShortcut: "alt+h",
        icon: Home,
        tier: "essential",
      },
      {
        href: "/onboarding",
        label: "Onboarding",
        title: "Guided operator onboarding checklist",
        icon: BookOpen,
        tier: "essential",
      },
      {
        href: "/runs/new",
        label: "New run",
        title: navTitleWithShortcut(
          "Guided first-run wizard — system identity through pipeline tracking",
          "alt+n",
        ),
        keyShortcut: "alt+n",
        icon: Rocket,
        tier: "essential",
      },
      {
        href: "/runs?projectId=default",
        label: "Runs",
        title: navTitleWithShortcut("Runs list — open detail, manifest, artifacts, exports", "alt+r"),
        keyShortcut: "alt+r",
        icon: ListOrdered,
        tier: "essential",
      },
      {
        href: "/graph",
        label: "Graph",
        title: navTitleWithShortcut("Provenance or architecture graph for one run ID", "alt+y"),
        keyShortcut: "alt+y",
        icon: GitGraph,
        // Graph is a useful inspection tool but is not part of the Core Pilot path
        // (create → run → commit → review). It surfaces under "Show more links".
        tier: "extended",
      },
      {
        href: "/compare",
        label: "Compare two runs",
        title: navTitleWithShortcut("Diff two runs (base vs target)", "alt+c"),
        keyShortcut: "alt+c",
        icon: GitCompare,
        tier: "extended",
      },
      {
        href: "/replay",
        label: "Replay a run",
        title: navTitleWithShortcut("Re-validate authority chain for one run", "alt+p"),
        keyShortcut: "alt+p",
        icon: Play,
        tier: "extended",
        requiredAuthority: "ExecuteAuthority",
      },
    ],
  },
  {
    id: "qa-advisory",
    // Product layer: Advanced Analysis
    label: "Advanced Analysis",
    caption: "When Core Pilot cannot answer your question (diff, replay, graph, Q&A).",
    links: [
      {
        href: "/ask",
        label: "Ask",
        title: navTitleWithShortcut("Natural language ask against architecture context", "alt+a"),
        keyShortcut: "alt+a",
        icon: MessageSquare,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/search",
        label: "Search",
        title: "Search indexed architecture content",
        icon: Search,
        tier: "advanced",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/advisory",
        label: "Advisory",
        title: "Advisory scans and architecture digests",
        icon: Activity,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/recommendation-learning",
        label: "Recommendation learning",
        title: "Recommendation learning profiles",
        icon: Sparkles,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/product-learning",
        label: "Pilot feedback",
        title: "Pilot feedback rollups and triage (58R)",
        icon: ClipboardList,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/planning",
        label: "Planning",
        title: "Improvement themes and prioritized plans (59R)",
        icon: BarChart3,
        tier: "advanced",
        requiredAuthority: "ExecuteAuthority",
      },
      {
        href: "/evolution-review",
        label: "Evolution candidates",
        title: "Candidate simulations and before/after review (60R)",
        icon: GitBranch,
        tier: "advanced",
        requiredAuthority: "ExecuteAuthority",
      },
      {
        href: "/advisory-scheduling",
        label: "Schedules",
        title: "Advisory scan schedules",
        icon: Wrench,
        tier: "advanced",
        requiredAuthority: "ExecuteAuthority",
      },
      {
        href: "/digests",
        label: "Digests",
        title: "Architecture digests",
        icon: FileSearch,
        tier: "advanced",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/digest-subscriptions",
        label: "Subscriptions",
        title: "Digest email subscriptions",
        icon: Mail,
        tier: "advanced",
        requiredAuthority: "ExecuteAuthority",
      },
    ],
  },
  {
    id: "alerts-governance",
    // Product layer: Enterprise Controls
    label: "Enterprise Controls",
    caption: "Approvals, policy, audit evidence, and alert operations — primarily operator/admin responsibilities.",
    links: [
      {
        href: "/alerts",
        label: "Alerts",
        title: navTitleWithShortcut("Open and acknowledged alerts — core operational inbox", "alt+l"),
        keyShortcut: "alt+l",
        icon: Bell,
        tier: "essential",
        requiredAuthority: "ReadAuthority",
      },
      { href: "/alert-rules", label: "Alert rules", title: "Configure alert rules", icon: Tags, tier: "advanced" },
      { href: "/alert-routing", label: "Alert routing", title: "Alert routing subscriptions", icon: Mail, tier: "advanced" },
      { href: "/composite-alert-rules", label: "Composite rules", title: "Composite alert rules", icon: Tags, tier: "advanced" },
      { href: "/alert-simulation", label: "Alert simulation", title: "Simulate alert evaluation", icon: Activity, tier: "advanced" },
      { href: "/alert-tuning", label: "Alert tuning", title: "Alert noise and threshold tuning", icon: Wrench, tier: "advanced" },
      { href: "/policy-packs", label: "Policy packs", title: "Policy packs and versions", icon: Shield, tier: "extended" },
      {
        href: "/governance-resolution",
        label: "Governance resolution",
        title: "Effective governance resolution — operator/admin surface",
        icon: Scale,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/governance/dashboard",
        label: "Dashboard",
        title: navTitleWithShortcut(
          "Cross-run governance dashboard — pending approvals and policy changes (operator/admin)",
          "alt+g",
        ),
        keyShortcut: "alt+g",
        icon: LayoutDashboard,
        tier: "extended",
        requiredAuthority: "ReadAuthority",
      },
      {
        href: "/governance",
        label: "Governance workflow",
        title: "Approval, promotion, and activation workflow — operator/admin surface",
        icon: GitBranch,
        tier: "advanced",
        requiredAuthority: "ExecuteAuthority",
      },
      {
        href: "/audit",
        label: "Audit log",
        title: "Search and filter audit events",
        icon: FileSearch,
        tier: "advanced",
        requiredAuthority: "ReadAuthority",
      },
      { href: "/audit", label: "Audit log", title: "Search and filter audit events", icon: FileSearch, tier: "advanced" },
    ],
  },
];

/**
 * Flat list for command palette search (value = href) — all tiers; progressive disclosure does not apply.
 * Authority metadata is present on each item but callers may still filter (palette uses the same rank as the sidebar).
 */
export function flattenNavLinks(): NavLinkItem[] {
  return NAV_GROUPS.flatMap((g) => g.links);
}
