import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE,
  ASK_REVIEW_QUESTIONS_SOURCES,
  ASK_REVIEW_QUESTIONS_SOURCES_INTRO,
} from "@/lib/ask-review-questions-evidence-copy";

/** Sources-only follow-ups for `/insights/ask-review-questions` buyer-polished shell (ASK). */
export function AskSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="ask-review-questions"
      stripTestId="ask-review-questions-sources-strip"
      sourcesTestId="ask-review-questions-sources"
      sourcesTitle={ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={ASK_REVIEW_QUESTIONS_SOURCES_INTRO}
      sources={ASK_REVIEW_QUESTIONS_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
