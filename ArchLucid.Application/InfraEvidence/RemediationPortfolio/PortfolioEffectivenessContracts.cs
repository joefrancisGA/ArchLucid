namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public sealed record PortfolioActionVerificationLink(string ActionId, Guid InstanceId);
public sealed record PortfolioLaterObservation(string ScenarioId, PortfolioExposureState State, string EvidenceSha256);

/// <summary>Independently reviewed observations of the same scenarios on one later snapshot, not solver or simulation output.</summary>
public sealed record PortfolioEffectivenessReview(PortfolioOptimizationPin Portfolio, string PlanSha256, string ModeledImpactSha256,
    Guid LaterSnapshotId, string LaterInventorySha256, IReadOnlyList<PortfolioActionVerificationLink> Actions,
    IReadOnlyList<PortfolioLaterObservation> Observations);

public enum PortfolioEffectivenessStatus { Measured, Inconclusive, Rejected }
public enum PortfolioObservedComparison { Agrees, Contradicts, Unknown }

public sealed record PortfolioObservedScenario(string ScenarioId, PortfolioExposureState Baseline, PortfolioExposureState Predicted, PortfolioExposureState Observed,
    PortfolioObservedComparison Comparison, string? ObservedEvidenceSha256);

public sealed record PortfolioVerifiedActionReceipt(string ActionId, Guid InstanceId, string ReceiptSha256);

public sealed record PortfolioEffectivenessResult(string Version, PortfolioOptimizationPin Portfolio, PortfolioEffectivenessStatus Status,
    string? ReviewSha256, Guid? LaterSnapshotId, IReadOnlyList<PortfolioObservedScenario> Scenarios, IReadOnlyList<PortfolioIssue> Issues)
{
    public IReadOnlyList<PortfolioVerifiedActionReceipt> VerifiedActionReceipts { get; init; } = [];
}

public sealed record PortfolioCalibrationSummary(string Version, int CandidateScenarios, int Agreements, int Contradictions, int Unknown, int MeasuredChangedPredictions)
{
    public int MeasuredSamples => Agreements + Contradictions;
}
