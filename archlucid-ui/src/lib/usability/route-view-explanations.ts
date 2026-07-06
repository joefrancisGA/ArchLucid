/**

 * Plain-language "Explain this view" copy for high-density operator routes.

 */



import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  POLICY_PACKS_VIEW_EXPLANATION_NEXT_ACTION,
  POLICY_PACKS_VIEW_EXPLANATION_SUMMARY,
} from "@/lib/policy-packs-page";
import {
  STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,
  STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY,
} from "@/lib/standards-rules-page";

import {

  RISK_EXCEPTIONS_VIEW_EXPLANATION_NEXT_ACTION,

  RISK_EXCEPTIONS_VIEW_EXPLANATION_SUMMARY,

} from "@/lib/risk-exceptions-page";



export type RouteViewExplanation = {

  readonly title: string;

  readonly summary: string;

  readonly nextAction: string;

};



const ROUTE_VIEW_EXPLANATIONS: readonly { prefix: string; explanation: RouteViewExplanation }[] = [

  {

    prefix: "/graph",

    explanation: {

      title: "Evidence graph",

      summary:

        "Trace how architecture evidence supports findings, decisions, approvals, and the final review package.",

      nextAction: "Select a node to inspect linked evidence and decisions in the side panel.",

    },

  },

  {

    prefix: "/compare",

    explanation: {

      title: "Compare two reviews",

      summary: "Side-by-side diff of two architecture reviews — findings, decision records, and cost deltas.",

      nextAction: "Pick a baseline and updated review, then read the structured comparison summary.",

    },

  },

  {

    prefix: "/governance",

    explanation: {

      title: OPERATOR_NAV_LINK_LABELS.governanceWorkflow,

      summary: "Approvals, promotions, and policy activations for committed architecture reviews.",

      nextAction: "Start from pending approvals or open the architecture risk register to clear blocking items.",

    },

  },

  {

    prefix: "/audit",

    explanation: {

      title: "Audit trail",

      summary: "Append-only record of authenticated actions in your workspace — search, filter, and export.",

      nextAction: "Search by actor or event type; export CSV when you need evidence for compliance review.",

    },

  },

];



export function routeViewExplanationForPathname(pathname: string): RouteViewExplanation | null {

  const path = (pathname ?? "").split("?")[0] ?? "";



  if (path === "/governance/findings" || path.startsWith("/governance/findings/")) {

    return null;

  }



  if (path === "/governance/risk-exceptions" || path.startsWith("/governance/risk-exceptions/")) {

    return {

      title: "Risk exceptions",

      summary: RISK_EXCEPTIONS_VIEW_EXPLANATION_SUMMARY,

      nextAction: RISK_EXCEPTIONS_VIEW_EXPLANATION_NEXT_ACTION,

    };

  }



  if (path === "/governance/policy-packs" || path === "/policy-packs" || path.startsWith("/governance/policy-packs/")) {

    return {

      title: "Policy packs",

      summary: POLICY_PACKS_VIEW_EXPLANATION_SUMMARY,

      nextAction: POLICY_PACKS_VIEW_EXPLANATION_NEXT_ACTION,

    };

  }



  if (path === "/governance/resolution" || path.startsWith("/governance/resolution/")) {

    return {

      title: "Standards & rules",

      summary: STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY,

      nextAction: STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,

    };

  }



  const sorted = [...ROUTE_VIEW_EXPLANATIONS].sort((left, right) => right.prefix.length - left.prefix.length);



  for (const row of sorted) {

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {

      return row.explanation;

    }

  }



  return null;

}

