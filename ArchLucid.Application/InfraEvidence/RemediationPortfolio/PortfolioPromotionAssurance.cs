using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public sealed record PortfolioBenchmarkMeasurement(string FixtureId, string InputSha256, bool FeasibleAndWithinExpectedQuality,
    long OptimizerPoints, long TopNPoints, long GreedyPoints, long? UpperBoundPoints, int SearchNodes, int TopNEvaluations,
    int GreedyEvaluations, long WallMilliseconds, long ProcessCpuMilliseconds, long ProcessPeakWorkingSetBytes,
    long ThreadAllocatedBytes, decimal? EstimatedComputeCostUsd);

public sealed record PortfolioBenchmarkReport(string CohortVersion, string SolverVersion,
    IReadOnlyList<PortfolioBenchmarkMeasurement> Measurements)
{
    public string? MeasurementEnvironment { get; init; }
    public decimal? UsdPerCpuHour { get; init; }
}

/// <summary>Approved, versioned prerequisites for promotion review. No built-in thresholds or rollout authority.</summary>
public sealed record PortfolioPromotionPolicy(string Version, string CohortVersion, int MinimumBenchmarkCases,
    long MaximumWallMilliseconds, long MaximumCpuMilliseconds, long MaximumPeakWorkingSetBytes, decimal? MaximumComputeCostUsd,
    int MinimumMeasuredScenarios, int MaximumContradictions, int MaximumUnknown)
{
    public IReadOnlyList<string> RequiredBenchmarkFixtureIds { get; init; } = [];
    public int MinimumMeasuredChangedPredictions { get; init; } = 1;
}

public sealed record PortfolioPromotionDecision(bool EligibleForPromotionReview, string? EvidenceSha256,
    PortfolioCalibrationSummary Calibration, IReadOnlyList<PortfolioIssue> Issues);

/// <summary>Fail-closed assurance decision from an independently pinned package. Does not activate a release.</summary>
public static class PortfolioPromotionAssurance
{
    public const string Version = "FND093-portfolio-promotion-assurance-v1";
    private const string CalibrationVersion = "FND093-paired-scenario-counts-v1";
    private const int MaxEvidenceRows = 30_000;

    public static string EvidenceSha256(PortfolioPromotionPolicy policy, PortfolioBenchmarkReport report,
        IReadOnlyList<PortfolioEffectivenessResult> reviewedLaterEvidence) =>
        AnalysisDependencyFingerprint.Digest(new { Version, Policy = policy, Benchmark = report, Later = reviewedLaterEvidence });

    public static PortfolioPromotionDecision Evaluate(PortfolioPromotionPolicy policy, PortfolioBenchmarkReport report,
        IReadOnlyList<PortfolioEffectivenessResult> reviewedLaterEvidence, string expectedSha256)
    {
        ArgumentNullException.ThrowIfNull(policy);
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(reviewedLaterEvidence);
        List<PortfolioIssue> issues = [];
        if (string.IsNullOrWhiteSpace(policy.Version) || string.IsNullOrWhiteSpace(policy.CohortVersion)
            || policy.MinimumBenchmarkCases < 1 || policy.MaximumWallMilliseconds < 1 || policy.MaximumCpuMilliseconds < 1
            || policy.MaximumPeakWorkingSetBytes < 1 || policy.MaximumComputeCostUsd < 0
            || policy.RequiredBenchmarkFixtureIds is null || policy.RequiredBenchmarkFixtureIds.Count > 256
            || policy.RequiredBenchmarkFixtureIds.Any(string.IsNullOrWhiteSpace)
            || policy.MinimumMeasuredScenarios < 1 || policy.MinimumMeasuredChangedPredictions < 1 || policy.MaximumContradictions < 0 || policy.MaximumUnknown < 0
            || report.Measurements is null || report.Measurements.Count > 256 || reviewedLaterEvidence.Count > 512
            || reviewedLaterEvidence.Any(row => row is null || row.Scenarios is null || row.Scenarios.Count > 2_048
                || row.VerifiedActionReceipts is null || row.VerifiedActionReceipts.Count > RemediationPortfolioGraphBuilder.MaxActions)
            || reviewedLaterEvidence.Sum(row => row.Scenarios.Count) > MaxEvidenceRows
            || !PortfolioImpactInputs.Hash(expectedSha256))
            return new(false, null, new(CalibrationVersion, 0, 0, 0, 0, 0),
                [new("policy", "invalid_or_unbounded_assurance_input")]);

        string digest = EvidenceSha256(policy, report, reviewedLaterEvidence);
        if (!string.Equals(digest, expectedSha256, StringComparison.OrdinalIgnoreCase))
            return new(false, null, new(CalibrationVersion, 0, 0, 0, 0, 0),
                [new("evidence", "reviewed_assurance_digest_mismatch")]);

        if (report.CohortVersion != policy.CohortVersion || report.SolverVersion != BoundedRemediationPortfolioOptimizer.Version
            || report.Measurements.Count < policy.MinimumBenchmarkCases
            || string.IsNullOrWhiteSpace(report.MeasurementEnvironment)
            || (policy.MaximumComputeCostUsd is not null && report.UsdPerCpuHour is not (> 0 and <= 10_000)))
            issues.Add(new("benchmark", "wrong_or_incomplete_benchmark_cohort"));

        HashSet<string> fixtures = new(StringComparer.Ordinal);
        HashSet<string> inputs = new(StringComparer.OrdinalIgnoreCase);
        foreach (var row in report.Measurements)
        {
            if (row is null || string.IsNullOrWhiteSpace(row.FixtureId) || !fixtures.Add(row.FixtureId)
                || !PortfolioImpactInputs.Hash(row.InputSha256) || !inputs.Add(row.InputSha256))
            {
                issues.Add(new("benchmark", "missing_or_duplicate_benchmark_input"));
                continue;
            }

            if (!row.FeasibleAndWithinExpectedQuality || row.TopNPoints < 0 || row.GreedyPoints < 0 || row.OptimizerPoints < 0
                || row.OptimizerPoints < Math.Max(row.TopNPoints, row.GreedyPoints)
                || row.UpperBoundPoints is not long upper || upper < row.OptimizerPoints || row.SearchNodes < 1
                || row.TopNEvaluations < 0 || row.GreedyEvaluations < 0)
                issues.Add(new(row.FixtureId, "solver_quality_or_feasibility_failed"));
            if (row.WallMilliseconds < 1 || row.WallMilliseconds > policy.MaximumWallMilliseconds
                || row.ProcessCpuMilliseconds < 0 || row.ProcessCpuMilliseconds > policy.MaximumCpuMilliseconds
                || row.ProcessPeakWorkingSetBytes < 1 || row.ProcessPeakWorkingSetBytes > policy.MaximumPeakWorkingSetBytes
                || row.ThreadAllocatedBytes < 0 || row.EstimatedComputeCostUsd < 0
                || (policy.MaximumComputeCostUsd is decimal cap
                    && (row.EstimatedComputeCostUsd is not decimal cost || cost > cap
                        || cost != report.UsdPerCpuHour * row.ProcessCpuMilliseconds / 3_600_000m)))
                issues.Add(new(row.FixtureId, "resource_evidence_missing_or_budget_exceeded"));
        }

        if (!fixtures.IsSupersetOf(policy.RequiredBenchmarkFixtureIds))
            issues.Add(new("benchmark", "required_benchmark_fixture_missing"));

        var calibration = Calibrate(reviewedLaterEvidence, issues);
        if (calibration.MeasuredSamples < policy.MinimumMeasuredScenarios
            || calibration.MeasuredChangedPredictions < policy.MinimumMeasuredChangedPredictions || calibration.Contradictions > policy.MaximumContradictions
            || calibration.Unknown > policy.MaximumUnknown)
            issues.Add(new("later-evidence", "observed_coverage_or_regression_threshold_failed"));

        return new(issues.Count == 0, digest, calibration, RemediationPortfolioGraph.SortIssues(issues));
    }

    private static PortfolioCalibrationSummary Calibrate(IReadOnlyList<PortfolioEffectivenessResult> evidence, List<PortfolioIssue> issues)
    {
        var comparable = new Dictionary<(Guid Tenant, Guid Workspace, Guid Project, Guid LaterSnapshot, string Scenario),
            (PortfolioExposureState Baseline, PortfolioExposureState Predicted, PortfolioExposureState Observed,
                PortfolioObservedComparison Comparison)>();
        foreach (var entry in evidence)
        {
            if (entry.Version != PortfolioEffectivenessReader.Version || entry.Status is not
                (PortfolioEffectivenessStatus.Measured or PortfolioEffectivenessStatus.Inconclusive)
                || entry.LaterSnapshotId is not Guid laterId || laterId == Guid.Empty
                || !PortfolioImpactInputs.Hash(entry.ReviewSha256) || entry.Portfolio is null || entry.Scenarios.Count == 0)
            {
                issues.Add(new("later-evidence", "unusable_reviewed_observation_receipt"));
                continue;
            }

            var scope = entry.Portfolio.Binding.Scope;
            bool hasVerifiedReceipts = entry.VerifiedActionReceipts.Count != 0
                && entry.VerifiedActionReceipts.All(row => row is not null && row.InstanceId != Guid.Empty
                    && !string.IsNullOrWhiteSpace(row.ActionId) && PortfolioImpactInputs.Hash(row.ReceiptSha256))
                && entry.VerifiedActionReceipts.Select(row => row.InstanceId).Distinct().Count() == entry.VerifiedActionReceipts.Count;
            foreach (var row in entry.Scenarios)
            {
                if (row is null || string.IsNullOrWhiteSpace(row.ScenarioId))
                {
                    issues.Add(new("later-evidence", "invalid_observation_identity"));
                    continue;
                }
                var expected = row.Predicted == PortfolioExposureState.Unknown || row.Observed == PortfolioExposureState.Unknown
                    ? PortfolioObservedComparison.Unknown : row.Predicted == row.Observed ? PortfolioObservedComparison.Agrees
                    : PortfolioObservedComparison.Contradicts;
                if (!Enum.IsDefined(row.Baseline) || !Enum.IsDefined(row.Predicted) || !Enum.IsDefined(row.Observed) || row.Comparison != expected
                    || (row.Observed == PortfolioExposureState.AbsentWithinCoverage && !hasVerifiedReceipts)
                    || (expected != PortfolioObservedComparison.Unknown && !PortfolioImpactInputs.Hash(row.ObservedEvidenceSha256))
                    || (entry.Status == PortfolioEffectivenessStatus.Measured && expected == PortfolioObservedComparison.Unknown))
                {
                    issues.Add(new("later-evidence", "observation_comparison_or_provenance_invalid"));
                    continue;
                }

                var key = (scope.TenantId, scope.WorkspaceId, scope.ProjectId, laterId, row.ScenarioId);
                var value = (row.Baseline, row.Predicted, row.Observed, row.Comparison);
                if (!comparable.TryAdd(key, value) && comparable[key] != value)
                {
                    comparable[key] = (PortfolioExposureState.Unknown, PortfolioExposureState.Unknown, PortfolioExposureState.Unknown, PortfolioObservedComparison.Unknown);
                    issues.Add(new("later-evidence", "conflicting_repeated_observation"));
                }
            }
        }

        return new(CalibrationVersion, comparable.Count,
            comparable.Values.Count(x => x.Comparison == PortfolioObservedComparison.Agrees),
            comparable.Values.Count(x => x.Comparison == PortfolioObservedComparison.Contradicts),
            comparable.Values.Count(x => x.Comparison == PortfolioObservedComparison.Unknown),
            comparable.Values.Count(x => x.Comparison != PortfolioObservedComparison.Unknown
                && x.Baseline != PortfolioExposureState.Unknown && x.Baseline != x.Predicted));
    }
}
