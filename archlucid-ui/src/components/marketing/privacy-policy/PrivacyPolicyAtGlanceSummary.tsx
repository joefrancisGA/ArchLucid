import { PRIVACY_POLICY_LAYOUT } from "@/lib/privacy-policy-layout";

const AT_A_GLANCE_ITEMS: readonly { readonly label: string; readonly detail: string }[] = [
  {
    label: "What we collect",
    detail:
      "Account and workspace identity, product usage telemetry, support correspondence, and optional marketing analytics when you consent.",
  },
  {
    label: "What we do not collect by default",
    detail:
      "Customer workload architecture content is processed to run the Service but is not used to train foundation models.",
  },
  {
    label: "How we share information",
    detail:
      "With subprocessors that help operate the Service, when you direct integrations, or when law or safety requires it.",
  },
  {
    label: "How long we keep it",
    detail: "Retention varies by data category — account data, audit logs, and support records follow different schedules.",
  },
  {
    label: "Your rights",
    detail:
      "GDPR and CCPA rights include access, correction, deletion, and opt-out of sale or sharing where applicable.",
  },
] as const;

/** Plain-language orientation above the full legal policy body. */
export function PrivacyPolicyAtGlanceSummary(): React.JSX.Element {
  return (
    <aside
      className={PRIVACY_POLICY_LAYOUT.atGlance}
      aria-labelledby="privacy-policy-at-glance-heading"
      data-testid="privacy-policy-at-glance"
    >
      <h2 id="privacy-policy-at-glance-heading" className={PRIVACY_POLICY_LAYOUT.atGlanceTitle}>
        At a glance
      </h2>
      <p className={PRIVACY_POLICY_LAYOUT.atGlanceNote}>
        Summary only — the complete policy below governs how ArchLucid handles personal information.
      </p>
      <ul className={PRIVACY_POLICY_LAYOUT.atGlanceList}>
        {AT_A_GLANCE_ITEMS.map((item) => (
          <li key={item.label}>
            <span className={PRIVACY_POLICY_LAYOUT.atGlanceItemLabel}>{item.label}: </span>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
