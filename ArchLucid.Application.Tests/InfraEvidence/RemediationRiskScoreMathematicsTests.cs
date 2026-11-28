using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationRiskScoreMathematicsTests
{
    private static readonly OperationalSecurityFindingRecord CompleteFinding = new()
    {
        Severity = "high",
        Exploitability = "none",
        Exposure = "low",
        BusinessCriticality = "medium",
        BlastRadius = "high",
    };

    private static OperationalSecurityFindingMetadataRecord Metadata(string key, string value) => new()
    {
        MetadataKey = key,
        MetadataValue = value,
    };

    private static readonly OperationalSecurityFindingMetadataRecord[] CompleteMetadata =
    [
        Metadata("knownExploitation", "false"),
        Metadata("identityControlPlaneImpact", "none"),
        Metadata("dataSensitivity", "low"),
    ];

    [Fact]
    public void Historic_v1_preserves_the_hand_calculated_mixed_score_and_rollback_contribution()
    {
        RemediationRiskScoreResult withRollback = RemediationRiskScoreEvaluator.Evaluate(
            CompleteFinding, CompleteMetadata, true, "reviewed mitigation", RemediationAutomationLevel.SemiAutomated, true);
        RemediationRiskScoreResult withoutRollback = RemediationRiskScoreEvaluator.Evaluate(
            CompleteFinding, CompleteMetadata, true, "reviewed mitigation", RemediationAutomationLevel.SemiAutomated, false);

        Assert.Equal("IE15-priority-v1", RemediationPrioritizationConstants.RuleVersion);
        Assert.Equal(0.2815m, withRollback.TotalScore);
        Assert.Equal(0.3065m, withoutRollback.TotalScore);
        Assert.Equal(0.0125m, Contribution(withRollback, RemediationRiskFactor.RemediationRisk).WeightedContribution);
        Assert.Equal(0.0375m, Contribution(withoutRollback, RemediationRiskFactor.RemediationRisk).WeightedContribution);
        Assert.Equal(-0.05m, Contribution(withRollback, RemediationRiskFactor.CompensatingControls).WeightedContribution);
        Assert.Equal("Rule=IE15-priority-v1; Total=0.2815; Factors=11", withRollback.ExplanationSummary);
    }

    [Fact]
    public void Historic_v1_preserves_preexisting_missing_evidence_defaults()
    {
        RemediationRiskScoreResult result = RemediationRiskScoreEvaluator.Evaluate(
            new OperationalSecurityFindingRecord(), [], false, null, null, false);

        Assert.Equal(0.1975m, result.TotalScore);
        Assert.Equal("false", Contribution(result, RemediationRiskFactor.KnownExploitation).Source);
        Assert.Equal("no-rollback", Contribution(result, RemediationRiskFactor.RemediationRisk).Source);
    }

    [Fact]
    public void Advisory_separates_urgency_from_no_rollback_execution_risk()
    {
        RemediationRiskAdvisoryReport withRollback = Advisory(rollback: true);
        RemediationRiskAdvisoryReport withoutRollback = Advisory(rollback: false);

        Assert.Equal("IE15-priority-v2-shadow", withRollback.RuleVersion);
        Assert.Equal(0.2565m / 0.85m, withRollback.Urgency.Score);
        Assert.Equal(withRollback.Urgency.Score, withoutRollback.Urgency.Score);
        Assert.Equal(0.25m, withRollback.ExecutionRisk.Score);
        Assert.Equal(0.50m, withoutRollback.ExecutionRisk.Score);
        Assert.Equal(0.0375m, Factor(withoutRollback.ExecutionRisk, RemediationRiskFactor.RemediationRisk).LowerContribution);
        Assert.DoesNotContain(withoutRollback.Urgency.Factors, item => item.Factor == RemediationRiskFactor.RemediationRisk);
    }

    [Theory]
    [InlineData(RemediationAutomationLevel.Manual, 50)]
    [InlineData(RemediationAutomationLevel.Guided, 37.5)]
    [InlineData(RemediationAutomationLevel.SemiAutomated, 25)]
    [InlineData(RemediationAutomationLevel.Automated, 12.5)]
    public void Measured_automation_changes_only_the_execution_axis(RemediationAutomationLevel level, double expectedPercent)
    {
        var report = Advisory(automation: level);
        Assert.Equal(0.2565m / 0.85m, report.Urgency.Score);
        Assert.Equal((decimal)expectedPercent / 100m, report.ExecutionRisk.Score);
    }

    [Fact]
    public void Missing_evidence_does_not_create_an_urgency_or_execution_point_estimate()
    {
        var report = RemediationRiskScoreEvaluator.EvaluateAdvisory(new OperationalSecurityFindingRecord(), [], null, null, null);
        foreach (var axis in new[] { report.Urgency, report.ExecutionRisk })
        {
            Assert.Null(axis.Score);
            Assert.Equal(0m, axis.LowerBound);
            Assert.Equal(1m, axis.UpperBound);
            Assert.All(axis.Factors, factor =>
            {
                Assert.Equal(RemediationAdvisoryEvidence.Missing, factor.Evidence);
                Assert.Null(factor.NormalizedValue);
            });
        }
    }

    [Fact]
    public void Missing_rollback_is_distinct_from_verified_absence_of_rollback()
    {
        var unknown = Advisory(rollback: null);
        var missing = Factor(unknown.ExecutionRisk, RemediationRiskFactor.RemediationRisk);
        Assert.Null(unknown.ExecutionRisk.Score);
        Assert.Equal(0.125m, unknown.ExecutionRisk.LowerBound);
        Assert.Equal(0.625m, unknown.ExecutionRisk.UpperBound);
        Assert.Equal(RemediationAdvisoryEvidence.Missing, missing.Evidence);
        Assert.Equal(RemediationAdvisoryEvidence.Recorded,
            Factor(Advisory(rollback: false).ExecutionRisk, RemediationRiskFactor.RemediationRisk).Evidence);
    }

    [Fact]
    public void Unknown_controls_get_no_definite_credit_and_verified_controls_only_decrease_urgency()
    {
        var verified = Advisory(controls: true);
        var absent = Advisory(controls: false);
        var unknown = Advisory(controls: null);

        Assert.Equal(0.3065m / 0.85m, absent.Urgency.Score);
        Assert.Equal(0.2565m / 0.85m, verified.Urgency.Score);
        Assert.Null(unknown.Urgency.Score);
        Assert.Equal(verified.Urgency.Score, unknown.Urgency.LowerBound);
        Assert.Equal(absent.Urgency.Score, unknown.Urgency.UpperBound);
        Assert.Equal(absent.ExecutionRisk.Score, verified.ExecutionRisk.Score);
        Assert.Equal(-0.05m, Factor(unknown.Urgency, RemediationRiskFactor.CompensatingControls).LowerContribution);
        Assert.Equal(0m, Factor(unknown.Urgency, RemediationRiskFactor.CompensatingControls).UpperContribution);
    }

    [Fact]
    public void Explicit_false_is_not_unknown_and_conflicting_aliases_do_not_win_by_order()
    {
        var known = Advisory();
        var direct = Factor(known.Urgency, RemediationRiskFactor.KnownExploitation);
        Assert.Equal(RemediationAdvisoryEvidence.Recorded, direct.Evidence);
        Assert.Equal(0m, direct.NormalizedValue);

        OperationalSecurityFindingMetadataRecord[] conflict = [.. CompleteMetadata, Metadata("known_exploitation", "true")];
        var forward = Advisory(metadata: conflict);
        var reverse = Advisory(metadata: conflict.Reverse().ToArray());
        Assert.Null(forward.Urgency.Score);
        Assert.Equal(RemediationAdvisoryEvidence.Conflicting,
            Factor(forward.Urgency, RemediationRiskFactor.KnownExploitation).Evidence);
        Assert.Equal(forward.Urgency.Factors.ToArray(), reverse.Urgency.Factors.ToArray());
        Assert.Equal(forward.Urgency.LowerBound, reverse.Urgency.LowerBound);
        Assert.Equal(forward.Urgency.UpperBound, reverse.Urgency.UpperBound);
    }

    [Fact]
    public void Unknown_nonempty_labels_and_undefined_automation_are_not_normalized_as_facts()
    {
        var report = Advisory(automation: (RemediationAutomationLevel)999, metadata: [
            Metadata("knownExploitation", "not-collected"), Metadata("identityControlPlaneImpact", "none"),
            Metadata("dataSensitivity", "unsupported-level"),
        ]);
        Assert.Equal(RemediationAdvisoryEvidence.Unrecognized,
            Factor(report.Urgency, RemediationRiskFactor.KnownExploitation).Evidence);
        Assert.Equal(RemediationAdvisoryEvidence.Unrecognized,
            Factor(report.Urgency, RemediationRiskFactor.DataSensitivity).Evidence);
        Assert.Equal(RemediationAdvisoryEvidence.Unrecognized,
            Factor(report.ExecutionRisk, RemediationRiskFactor.RemediationComplexity).Evidence);
        Assert.Null(report.Urgency.Score);
        Assert.Null(report.ExecutionRisk.Score);
    }

    [Fact]
    public void Severity_ladder_is_monotone_and_dimensionless()
    {
        Dictionary<RemediationRiskFactor, decimal> weights = IsolatedWeights((RemediationRiskFactor.Severity, 1m));
        string[] severities = ["informational", " LOW ", "medium", "High", "critical"];
        decimal[] expected = [0.1m, 0.25m, 0.5m, 0.75m, 1m];
        for (int i = 0; i < severities.Length; i++)
        {
            var report = RemediationRiskScoreEvaluator.EvaluateAdvisory(
                new OperationalSecurityFindingRecord { Severity = severities[i] }, [], null, null, null, weights);
            Assert.Equal(expected[i], report.Urgency.Score);
            Assert.Null(report.ExecutionRisk.Score);
        }
    }

    [Fact]
    public void Greater_exposure_is_monotone_and_bounded_independent_of_rollback()
    {
        Dictionary<RemediationRiskFactor, decimal> weights = IsolatedWeights((RemediationRiskFactor.InternetExposure, 1m));
        string[] observedLevels = ["none", "low", "medium", "high", "critical"];
        decimal[] expected = [0m, 0.30m, 0.55m, 0.85m, 1m];
        for (int i = 0; i < observedLevels.Length; i++)
        {
            var report = RemediationRiskScoreEvaluator.EvaluateAdvisory(
                new OperationalSecurityFindingRecord { Exposure = observedLevels[i] }, [], null, null, i % 2 == 0, weights);
            Assert.Equal(expected[i], report.Urgency.Score);
        }
    }

    [Fact]
    public void Changing_relative_tenant_weights_has_hand_calculated_sensitivity()
    {
        var left = IsolatedWeights((RemediationRiskFactor.Severity, 0.25m), (RemediationRiskFactor.InternetExposure, 0.75m));
        var right = IsolatedWeights((RemediationRiskFactor.Severity, 0.75m), (RemediationRiskFactor.InternetExposure, 0.25m));
        var first = Advisory(weights: left);
        var second = Advisory(weights: right);
        Assert.Equal(0.4125m, first.Urgency.Score);
        Assert.Equal(0.6375m, second.Urgency.Score);
        Assert.Null(first.ExecutionRisk.Score);
        left[RemediationRiskFactor.Severity] = 1m;
        Assert.Equal(0.25m, first.EffectiveWeights[RemediationRiskFactor.Severity]);
    }

    [Fact]
    public async Task Existing_weight_reader_and_advisory_use_each_tenants_scoped_profile_independently()
    {
        ScopeContext first = new() { TenantId = Guid.NewGuid() };
        ScopeContext second = new() { TenantId = Guid.NewGuid() };
        Mock<IRemediationPrioritizationRepository> weights = new(MockBehavior.Strict);
        weights.Setup(repo => repo.TryGetWeightsAsync(first.TenantId, CancellationToken.None))
            .ReturnsAsync(new RemediationPrioritizationWeightsRecord { WeightsJson = """{"Severity":0.35}""" });
        weights.Setup(repo => repo.TryGetWeightsAsync(second.TenantId, CancellationToken.None))
            .ReturnsAsync((RemediationPrioritizationWeightsRecord?)null);
        var service = new RemediationPrioritizationService(
            Mock.Of<IProjectScopedOperationalSecurityFindingRepository>(), Mock.Of<IOperationalSecurityExceptionRepository>(),
            Mock.Of<IRemediationPatternMatchRepository>(), Mock.Of<IRemediationPatternRepository>(), weights.Object);

        var custom = Advisory(weights: await service.GetWeightsAsync(first));
        var defaults = Advisory(weights: await service.GetWeightsAsync(second));

        Assert.Equal(0.4065m / 1.05m, custom.Urgency.Score);
        Assert.Equal(0.2565m / 0.85m, defaults.Urgency.Score);
        Assert.Equal(defaults.ExecutionRisk.Score, custom.ExecutionRisk.Score);
        weights.VerifyAll();
    }

    [Fact]
    public void Whole_axis_weight_normalization_is_scale_invariant()
    {
        var relative = IsolatedWeights((RemediationRiskFactor.Severity, 0.25m), (RemediationRiskFactor.InternetExposure, 0.25m));
        var scaled = IsolatedWeights((RemediationRiskFactor.Severity, 0.75m), (RemediationRiskFactor.InternetExposure, 0.75m));
        Assert.Equal(0.525m, Advisory(weights: relative).Urgency.Score);
        Assert.Equal(Advisory(weights: relative).Urgency.Score, Advisory(weights: scaled).Urgency.Score);
    }

    [Fact]
    public void Advisory_rejects_invalid_weights_rather_than_reversing_factor_polarity()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Advisory(weights: IsolatedWeights((RemediationRiskFactor.Severity, -0.1m))));
        Assert.Throws<ArgumentOutOfRangeException>(() => Advisory(weights: IsolatedWeights((RemediationRiskFactor.Severity, 1.1m))));
        Assert.Throws<ArgumentException>(() => Advisory(weights: IsolatedWeights(((RemediationRiskFactor)900, 0.50m))));
    }

    [Fact]
    public void Zero_weight_axes_do_not_claim_zero_risk_and_missing_zero_weight_evidence_does_not_create_uncertainty()
    {
        var disabled = Advisory(weights: IsolatedWeights());
        Assert.Null(disabled.Urgency.LowerBound);
        Assert.Null(disabled.ExecutionRisk.Score);
        var severityOnly = RemediationRiskScoreEvaluator.EvaluateAdvisory(
            CompleteFinding, [], null, null, null, IsolatedWeights((RemediationRiskFactor.Severity, 1m)));
        Assert.Equal(0.75m, severityOnly.Urgency.Score);
        Assert.Null(severityOnly.ExecutionRisk.LowerBound);
    }

    private static Dictionary<RemediationRiskFactor, decimal> IsolatedWeights(
        params (RemediationRiskFactor Factor, decimal Weight)[] selected)
    {
        var result = Enum.GetValues<RemediationRiskFactor>().ToDictionary(factor => factor, _ => 0m);
        foreach (var (factor, weight) in selected)
            result[factor] = weight;
        return result;
    }

    private static RemediationRiskAdvisoryReport Advisory(bool? rollback = true, bool? controls = true,
        RemediationAutomationLevel? automation = RemediationAutomationLevel.SemiAutomated,
        OperationalSecurityFindingMetadataRecord[]? metadata = null,
        IReadOnlyDictionary<RemediationRiskFactor, decimal>? weights = null) =>
        RemediationRiskScoreEvaluator.EvaluateAdvisory(CompleteFinding, metadata ?? CompleteMetadata,
            controls, automation, rollback, weights);

    private static RemediationAdvisoryFactor Factor(RemediationAdvisoryAxis axis, RemediationRiskFactor factor) =>
        Assert.Single(axis.Factors, item => item.Factor == factor);

    private static RemediationRiskFactorContribution Contribution(RemediationRiskScoreResult result, RemediationRiskFactor factor) =>
        Assert.Single(result.Contributions, item => item.Factor == factor);
}
