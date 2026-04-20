import type { Metadata } from "next";
import type { JSX } from "react";

import { OnboardWizardClient } from "./OnboardWizardClient";

export const metadata: Metadata = {
  title: "Core Pilot onboarding",
  description: "Four-step first-session wizard: request → seed → commit → manifest hand-off.",
};

export default function OnboardPage(): JSX.Element {
  return <OnboardWizardClient />;
}
