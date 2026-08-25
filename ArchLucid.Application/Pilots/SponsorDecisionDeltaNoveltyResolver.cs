using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Derives sponsor-safe decision-delta and novelty-confidence posture from persisted run findings and proof gates.
/// </summary>
public static class SponsorDecisionDeltaNoveltyResolver
{
    public const string DecisionDeltaSectionHeading = "## Decision delta (recommended changes)";
    public const string NoveltyConfidenceSectionHeading = "## Novelty confidence";

    public static SponsorDecisionDeltaNoveltyResult Resolve(
        ArchitectureRunDetail detail,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        PilotBuyerSafeEvidenceGateResult buyerSafeGate)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(buyerSafeGate);

        List<ArchitectureFinding> materialFindings = PilotMaterialFindingsCollector.Collect(detail, deltas, take: 5);
        string decisionDeltaSummary = BuildDecisionDeltaSummary(materialFindings, detail.IsCommitted);
        string nonObviousRationale = BuildNonObviousRationale(materialFindings, deltas, proof);
        SponsorNoveltyConfidence noveltyConfidence = ResolveNoveltyConfidence(materialFindings, deltas, proof, buyerSafeGate);
        string evidenceClassLabel = ResolveEvidenceClassLabel(proof, buyerSafeGate, deltas);
        string confidenceBasisSummary = BuildConfidenceBasisSummary(materialFindings, proof, buyerSafeGate, deltas);

        return new SponsorDecisionDeltaNoveltyResult(
            decisionDeltaSummary,
            nonObviousRationale,
            noveltyConfidence,
            evidenceClassLabel,
            confidenceBasisSummary);
    }

    private static string BuildDecisionDeltaSummary(IReadOnlyList<ArchitectureFinding> findings, bool isCommitted)
    {
        if (!isCommitted)
        {
            return "Review package is not committed — no sponsor-safe decision delta is attested yet. Finalize the review package before forwarding.";
        }

        if (findings.Count == 0)
        {
            return "No active findings recorded — ArchLucid did not surface a material recommended change in this package.";
        }

        StringBuilder sb = new();

        for (int index = 0; index < findings.Count; index++)
        {
            ArchitectureFinding finding = findings[index];
            string severity = finding.Severity.ToString();
            string category = string.IsNullOrWhiteSpace(finding.Category) ? "General" : finding.Category.Trim();
            string message = Truncate(finding.Message, 180);

            sb.Append(CultureInfo.InvariantCulture, $"{index + 1}. **{severity}** ({category}) — {message}");

            if (index < findings.Count - 1)
            {
                sb.Append("<br />");
            }
        }

        return sb.ToString();
    }

    private static string BuildNonObviousRationale(
        IReadOnlyList<ArchitectureFinding> findings,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof)
    {
        if (proof.DemoTenantWarningRequired)
        {
            return "Demo-derived output — treat as illustrative only; novelty is not attested for buyer outcomes.";
        }

        if (findings.Count == 0)
        {
            return "No findings to compare against a typical architecture review — non-obvious value is **not established** from this run alone.";
        }

        int evidenceBackedCount = findings.Count(static finding => finding.EvidenceRefs.Count > 0);
        bool hasHighSeverity = findings.Any(static finding =>
            finding.Severity is FindingSeverity.Error or FindingSeverity.Critical);

        if (hasHighSeverity && evidenceBackedCount >= 2)
        {
            return "Multiple severity-ranked findings include evidence references — the recommended changes are anchored to persisted proof, not generic checklist text.";
        }

        if (deltas.TopFindingEvidenceChain is not null)
        {
            return "Top-severity finding includes an evidence-chain pointer (manifest version + snapshot ids) — reviewers can trace why the recommendation differs from an undocumented baseline.";
        }

        return "Findings are present but evidence depth is limited — treat recommendations as directional until blind principal-architect validation is recorded.";
    }

    private static SponsorNoveltyConfidence ResolveNoveltyConfidence(
        IReadOnlyList<ArchitectureFinding> findings,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        PilotBuyerSafeEvidenceGateResult buyerSafeGate)
    {
        if (proof.DemoTenantWarningRequired || deltas.IsDemoTenant)
            return SponsorNoveltyConfidence.NotAssessed;

        if (!IsBuyerSafeSendAllowed(buyerSafeGate) || !proof.AgentOutputPilotStrictEvidenceSatisfied)
            return SponsorNoveltyConfidence.Low;

        if (findings.Count == 0)
            return SponsorNoveltyConfidence.NotAssessed;

        int scoredFindings = findings.Count(static finding =>
            finding.EvaluationConfidenceScore is >= 70
            || finding.ConfidenceLevel is FindingConfidenceLevel.High);

        if (scoredFindings >= 2 && deltas.TopFindingEvidenceChain is not null && proof.LlmCallCountResolved)
            return SponsorNoveltyConfidence.Strong;

        if (findings.Any(static finding => finding.EvidenceRefs.Count > 0))
            return SponsorNoveltyConfidence.Partial;

        return SponsorNoveltyConfidence.Low;
    }

    private static string ResolveEvidenceClassLabel(
        ProofPackageCompletenessResponse proof,
        PilotBuyerSafeEvidenceGateResult buyerSafeGate,
        PilotRunDeltas deltas)
    {
        if (proof.DemoTenantWarningRequired || deltas.IsDemoTenant)
            return "Demo-derived (not buyer outcome evidence)";

        if (!IsBuyerSafeSendAllowed(buyerSafeGate))
            return "Internal review only — buyer-safe send gate failed";

        if (proof.AgentOutputPilotStrictEvidenceSatisfied && proof.LlmCallCountResolved)
            return "Persisted run proof with PilotStrict posture attested";

        if (proof.LlmCallCountResolved)
            return "Persisted run proof — PilotStrict posture incomplete";

        return "Persisted run proof — LLM call basis unresolved";
    }

    private static string BuildConfidenceBasisSummary(
        IReadOnlyList<ArchitectureFinding> findings,
        ProofPackageCompletenessResponse proof,
        PilotBuyerSafeEvidenceGateResult buyerSafeGate,
        PilotRunDeltas deltas)
    {
        List<string> parts =
        [
            $"active findings: {findings.Count.ToString(CultureInfo.InvariantCulture)}",
            $"PilotStrict posture: {(proof.AgentOutputPilotStrictEvidenceSatisfied ? "satisfied" : "failed")}",
            $"buyer-safe send gate: {(IsBuyerSafeSendAllowed(buyerSafeGate) ? "allowed" : "blocked")}",
            $"LLM trace rows resolved: {(proof.LlmCallCountResolved ? deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture) : "no")}",
            "blind principal-architect sessions: not inferred — see repository `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`",
        ];

        return string.Join("; ", parts) + ".";
    }

    private static bool IsBuyerSafeSendAllowed(PilotBuyerSafeEvidenceGateResult buyerSafeGate) =>
        buyerSafeGate.ProofSendability is ProofPackageSendability.Sendable
        or ProofPackageSendability.SendableWithCaveats;

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "(no message)";

        string trimmed = value.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..(maxLength - 1)] + "…";
    }
}
