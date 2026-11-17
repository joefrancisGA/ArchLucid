"use client";

import {
  SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS,
  SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_HEADING,
  SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-first-useful-answer-home-copy";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";

export function SecureNowFirstUsefulAnswerHomeSection(): React.JSX.Element {
  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_HEADING}
      lead={SECURENOW_FIRST_USEFUL_ANSWER_HOME_SECTION_LEAD}
      rows={SECURENOW_FIRST_USEFUL_ANSWER_HOME_ROWS}
      sectionTestId="securenow-first-useful-answer-home-section"
      headingId="securenow-first-useful-answer-home-heading"
      tableAriaLabel="SecureNow first useful answer"
      linkTestIdPrefix="securenow-first-useful-answer-home-link"
    />
  );
}
