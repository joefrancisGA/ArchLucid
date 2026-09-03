"use client";

import { DecisionRegisterPageShell } from "./DecisionRegisterPageShell";
import { useDecisionRegisterPage } from "./use-decision-register-page";

export default function DecisionRegisterClient() {
  const state = useDecisionRegisterPage();

  return <DecisionRegisterPageShell {...state} />;
}
