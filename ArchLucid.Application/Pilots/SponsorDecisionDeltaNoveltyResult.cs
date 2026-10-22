namespace ArchLucid.Application.Pilots;

/// <summary>Resolved decision-delta and novelty posture for sponsor-facing Markdown exports.</summary>
public sealed record SponsorDecisionDeltaNoveltyResult(
    string DecisionDeltaSummary,
    string NonObviousRationale,
    SponsorNoveltyConfidence NoveltyConfidence,
    string EvidenceClassLabel,
    string ConfidenceBasisSummary);
