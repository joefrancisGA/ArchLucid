import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";

export const REVIEWS_NEW_PRIMARY_CONTENT_ID = "new-review-wizard" as const;

export const REVIEWS_NEW_SKIP_LINK_LABEL = "Skip to review intake workspace" as const;

export const REVIEWS_NEW_BREADCRUMB_REVIEWS_LABEL = "Architecture reviews" as const;

export const REVIEWS_NEW_BREADCRUMB_REVIEWS_PATH = REVIEWS_LIST_PATH;

export const REVIEWS_NEW_BREADCRUMB_TOPIC_TITLE = START_REVIEW_LABEL;

export const REVIEWS_NEW_BREADCRUMB_DETAILED_TOPIC_TITLE = REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL;

export const REVIEWS_NEW_BREADCRUMB_GUIDED_INTAKE_TOPIC_TITLE = REVIEWS_NEW_GUIDED_QUESTIONS_LABEL;
