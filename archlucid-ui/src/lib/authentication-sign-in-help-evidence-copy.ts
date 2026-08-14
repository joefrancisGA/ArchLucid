import { inAppHelpHref } from "@/lib/product-documentation-registry";

import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import {

  AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK,

  authenticationSignInHelpRelatedTopics,

} from "@/lib/authentication-sign-in-help-related-topics";



export const AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH = "/help/authentication-sign-in" as const;



export const AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL = "How authentication and sign-in work" as const;



export const AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE =

  "Use this guide when someone cannot sign in, needs an invitation, or is setting up SSO — then return to the sign-in screen when ready." as const;



export const AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";



export const AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE =

  "This guide orients architects on how people sign in and how identity connects to workspace access — open Users and roles, Security and trust help, or Configure SSO when you need live access or identity provider setup.";



export const AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID =
  "help-authentication-sign-in-claim-discipline-heading" as const;



export const AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO =

  "Use these follow-ups when sign-in vocabulary turns into roles, SSO setup, or identity provider configuration.";



/** Operator Sources — capped product routes; no `/help/enterprise-onboarding` dump (TB-1617). */

export const AUTHENTICATION_SIGN_IN_HELP_SOURCES: readonly EvidenceSourceLink[] = [

  AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK,

  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },

] as const;



export { authenticationSignInHelpRelatedTopics };

