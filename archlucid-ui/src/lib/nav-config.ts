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

export type NavLinkItem = {
  href: string;
  label: string;
  title: string;
  /** Registry combo for `aria-keyshortcuts`, e.g. `alt+n` */
  keyShortcut?: string;
  /** Optional icon for sidebar and mobile drawer. */
  icon?: LucideIcon;
};

export type NavGroupConfig = {
  id: string;
  label: string;
  links: NavLinkItem[];
};

function navTitleWithShortcut(baseTitle: string, registryCombo: string): string {
  const aria = registryKeyToAriaKeyShortcuts(registryCombo);

  return `${baseTitle} (${aria})`;
}

/** Canonical operator shell navigation — sidebar, command palette, and mobile drawer. */
export const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: "runs-review",
    label: "Runs & review",
    links: [
      {
        href: "/",
        label: "Home",
        title: navTitleWithShortcut("Home — V1 checklist and quick links", "alt+h"),
        keyShortcut: "alt+h",
        icon: Home,
      },
      {
        href: "/onboarding",
        label: "Onboarding",
        title: "Guided operator onboarding checklist",
        icon: BookOpen,
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
      },
      {
        href: "/runs?projectId=default",
        label: "Runs",
        title: navTitleWithShortcut("Runs list — open detail, manifest, artifacts, exports", "alt+r"),
        keyShortcut: "alt+r",
        icon: ListOrdered,
      },
      {
        href: "/graph",
        label: "Graph",
        title: navTitleWithShortcut("Provenance or architecture graph for one run ID", "alt+y"),
        keyShortcut: "alt+y",
        icon: GitGraph,
      },
      {
        href: "/compare",
        label: "Compare two runs",
        title: navTitleWithShortcut("Diff two runs (base vs target)", "alt+c"),
        keyShortcut: "alt+c",
        icon: GitCompare,
      },
      {
        href: "/replay",
        label: "Replay a run",
        title: navTitleWithShortcut("Re-validate authority chain for one run", "alt+p"),
        keyShortcut: "alt+p",
        icon: Play,
      },
    ],
  },
  {
    id: "qa-advisory",
    label: "Q&A & advisory",
    links: [
      {
        href: "/ask",
        label: "Ask",
        title: navTitleWithShortcut("Natural language ask against architecture context", "alt+a"),
        keyShortcut: "alt+a",
        icon: MessageSquare,
      },
      { href: "/search", label: "Search", title: "Search indexed architecture content", icon: Search },
      { href: "/advisory", label: "Advisory", title: "Advisory scans and architecture digests", icon: Activity },
      {
        href: "/recommendation-learning",
        label: "Learning",
        title: "Recommendation learning profiles",
        icon: Sparkles,
      },
      {
        href: "/product-learning",
        label: "Pilot feedback",
        title: "Pilot feedback rollups and triage (58R)",
        icon: ClipboardList,
      },
      { href: "/planning", label: "Planning", title: "Improvement themes and prioritized plans (59R)", icon: BarChart3 },
      {
        href: "/evolution-review",
        label: "Simulation review",
        title: "60R candidate simulations and before/after review",
        icon: GitBranch,
      },
      { href: "/advisory-scheduling", label: "Schedules", title: "Advisory scan schedules", icon: Wrench },
      { href: "/digests", label: "Digests", title: "Architecture digests", icon: FileSearch },
      { href: "/digest-subscriptions", label: "Subscriptions", title: "Digest email subscriptions", icon: Mail },
    ],
  },
  {
    id: "alerts-governance",
    label: "Alerts & governance",
    links: [
      {
        href: "/alerts",
        label: "Alerts",
        title: navTitleWithShortcut("Open and acknowledged alerts", "alt+l"),
        keyShortcut: "alt+l",
        icon: Bell,
      },
      { href: "/alert-rules", label: "Alert rules", title: "Configure alert rules", icon: Tags },
      { href: "/alert-routing", label: "Alert routing", title: "Alert routing subscriptions", icon: Mail },
      { href: "/composite-alert-rules", label: "Composite rules", title: "Composite alert rules", icon: Tags },
      { href: "/alert-simulation", label: "Alert simulation", title: "Simulate alert evaluation", icon: Activity },
      { href: "/alert-tuning", label: "Alert tuning", title: "Alert noise and threshold tuning", icon: Wrench },
      { href: "/policy-packs", label: "Policy packs", title: "Policy packs and versions", icon: Shield },
      {
        href: "/governance-resolution",
        label: "Governance resolution",
        title: "Effective governance resolution",
        icon: Scale,
      },
      {
        href: "/governance/dashboard",
        label: "Dashboard",
        title: navTitleWithShortcut(
          "Cross-run governance dashboard — pending approvals and policy changes",
          "alt+g",
        ),
        keyShortcut: "alt+g",
        icon: LayoutDashboard,
      },
      {
        href: "/governance",
        label: "Governance workflow",
        title: "Approval, promotion, and activation workflow",
        icon: GitBranch,
      },
      { href: "/audit", label: "Audit log", title: "Search and filter audit events", icon: FileSearch },
    ],
  },
];

/** Flat list for command palette search (value = href). */
export function flattenNavLinks(): NavLinkItem[] {
  return NAV_GROUPS.flatMap((g) => g.links);
}
