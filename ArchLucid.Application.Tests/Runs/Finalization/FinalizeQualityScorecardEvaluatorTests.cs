using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>TB-2321: each scorecard dimension is computed server-side and phrased exactly like the UI.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FinalizeQualityScorecardEvaluatorTests
{
    private static readonly IReadOnlyDictionary<string, FindingDisposition> NoDispositions =
        new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase);

    [Fact]
    public void Compute_returns_zero_counts_for_empty_snapshot()
    {
        FinalizeQualityScorecardCounts counts = FinalizeQualityScorecardEvaluator.Compute(
            new ArchitectureRequest(),
            new FindingsSnapshot(),
            NoDispositions,
            new FinalizeQualityGateOptions());

        counts.Should().Be(FinalizeQualityScorecardCounts.Empty);
    }

    [Fact]
    public void Compute_counts_blocking_findings_at_or_above_minimum_severity()
    {
        Finding open = NewFinding("Public storage account", FindingSeverity.Critical);
        Finding remediated = NewFinding("Fixed risk", FindingSeverity.Critical);
        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            [remediated.FindingId] = FindingDisposition.Remediated,
        };

        FinalizeQualityScorecardCounts counts = Compute([open, remediated], dispositions);

        counts.BlockingFindingCount.Should().Be(1);
    }

    [Fact]
    public void Compute_counts_uncovered_mandatory_requirements_from_coverage_gap_findings()
    {
        Finding gap = NewFinding("Uncovered requirement REQ-1", FindingSeverity.Warning);
        Finding mutedGap = NewFinding("Uncovered requirement REQ-2", FindingSeverity.Warning);
        mutedGap.IsMuted = true;

        FinalizeQualityScorecardCounts counts = Compute([gap, mutedGap]);

        counts.UncoveredMandatoryRequirementCount.Should().Be(1);
        counts.UnresolvedHighSeverityDispositionCount.Should().Be(0);
    }

    [Fact]
    public void Compute_counts_open_deferred_findings()
    {
        Finding deferred = NewFinding("Cannot determine ingress exposure", FindingSeverity.Warning);
        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            [deferred.FindingId] = FindingDisposition.Deferred,
        };

        FinalizeQualityScorecardCounts counts = Compute([deferred], dispositions);

        counts.OpenDeferredCount.Should().Be(1);
        counts.OpenCannotDetermineCount.Should().Be(0);
    }

    [Fact]
    public void Compute_counts_open_contradiction_findings()
    {
        Finding contradiction = NewFinding("Diagram contradicts narrative on ingress", FindingSeverity.Warning);

        FinalizeQualityScorecardCounts counts = Compute([contradiction]);

        counts.OpenContradictionCount.Should().Be(1);
        counts.OpenCannotDetermineCount.Should().Be(0);
    }

    [Fact]
    public void Compute_counts_open_cannot_determine_findings_and_excludes_closed_dispositions()
    {
        Finding open = NewFinding("Cannot determine TLS termination point", FindingSeverity.Warning);
        Finding accepted = NewFinding("Cannot verify WAF policy", FindingSeverity.Warning);
        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            [accepted.FindingId] = FindingDisposition.Accepted,
        };

        FinalizeQualityScorecardCounts counts = Compute([open, accepted], dispositions);

        counts.OpenCannotDetermineCount.Should().Be(1);
    }

    [Fact]
    public void Compute_counts_open_verify_hypothesis_findings_and_excludes_closed_dispositions()
    {
        Finding open = NewFinding("Exploratory adversarial challenge on ingress", FindingSeverity.Warning);
        open.EvidenceRefs.Clear();
        Finding accepted = NewFinding("Speculative hypothesis about WAF", FindingSeverity.Warning);
        accepted.EvidenceRefs.Clear();
        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            [accepted.FindingId] = FindingDisposition.Accepted,
        };

        FinalizeQualityScorecardCounts counts = Compute([open, accepted], dispositions);

        counts.OpenVerifyHypothesisCount.Should().Be(1);
    }

    [Fact]
    public void Compute_counts_unverified_assumptions_from_request_and_findings()
    {
        ArchitectureRequest request = new()
        {
            Assumptions = ["Traffic peaks at 2x baseline", "Single region is acceptable"],
        };
        Finding assumptionFinding = NewFinding("Assumption: vendor SLA covers failover", FindingSeverity.Info);

        FinalizeQualityScorecardCounts counts = FinalizeQualityScorecardEvaluator.Compute(
            request,
            new FindingsSnapshot { Findings = [assumptionFinding] },
            NoDispositions,
            new FinalizeQualityGateOptions());

        counts.UnverifiedAssumptionCount.Should().Be(3);
    }

    [Fact]
    public void Compute_counts_unresolved_high_severity_and_low_confidence_only_at_or_above_minimum_severity()
    {
        Finding criticalLow = NewFinding("Public storage account", FindingSeverity.Critical);
        criticalLow.ConfidenceLevel = FindingConfidenceLevel.Low;
        Finding errorHigh = NewFinding("Missing WAF", FindingSeverity.Error);
        errorHigh.ConfidenceLevel = FindingConfidenceLevel.High;
        Finding warningLow = NewFinding("Tag hygiene", FindingSeverity.Warning);
        warningLow.ConfidenceLevel = FindingConfidenceLevel.Low;

        FinalizeQualityScorecardCounts counts = Compute([criticalLow, errorHigh, warningLow]);

        counts.BlockingFindingCount.Should().Be(2);
        counts.UnresolvedHighSeverityDispositionCount.Should().Be(2);
        counts.LowExtractionConfidenceCount.Should().Be(1);
    }

    [Fact]
    public void Compute_excludes_resolved_muted_and_advisory_findings_from_high_severity_count()
    {
        Finding approved = NewFinding("Approved risk", FindingSeverity.Critical);
        approved.HumanReviewStatus = FindingHumanReviewStatus.Approved;
        Finding remediated = NewFinding("Fixed risk", FindingSeverity.Critical);
        Finding muted = NewFinding("Muted risk", FindingSeverity.Critical);
        muted.IsMuted = true;
        Finding advisory = NewFinding("Advisory baseline", FindingSeverity.Critical);
        advisory.EnforcementTier = FindingEnforcementTier.Advisory;
        Finding open = NewFinding("Open risk", FindingSeverity.Critical);
        Dictionary<string, FindingDisposition> dispositions = new(StringComparer.OrdinalIgnoreCase)
        {
            [remediated.FindingId] = FindingDisposition.Remediated,
        };

        FinalizeQualityScorecardCounts counts = Compute([approved, remediated, muted, advisory, open], dispositions);

        counts.BlockingFindingCount.Should().Be(1);
        counts.UnresolvedHighSeverityDispositionCount.Should().Be(1);
    }

    [Fact]
    public void Compute_honours_configured_minimum_severity()
    {
        Finding warning = NewFinding("Tag hygiene", FindingSeverity.Warning);
        FinalizeQualityGateOptions options = new() { MinimumUnresolvedSeverity = "Warning" };

        FinalizeQualityScorecardCounts counts = FinalizeQualityScorecardEvaluator.Compute(
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = [warning] },
            NoDispositions,
            options);

        counts.BlockingFindingCount.Should().Be(1);
        counts.UnresolvedHighSeverityDispositionCount.Should().Be(1);
    }

    [Fact]
    public void Compute_falls_back_to_error_when_minimum_severity_is_invalid()
    {
        Finding warning = NewFinding("Tag hygiene", FindingSeverity.Warning);
        Finding error = NewFinding("Missing WAF", FindingSeverity.Error);
        FinalizeQualityGateOptions options = new() { MinimumUnresolvedSeverity = "not-a-severity" };

        FinalizeQualityScorecardCounts counts = FinalizeQualityScorecardEvaluator.Compute(
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = [warning, error] },
            NoDispositions,
            options);

        counts.BlockingFindingCount.Should().Be(1);
        counts.UnresolvedHighSeverityDispositionCount.Should().Be(1);
    }

    [Fact]
    public void GetBlockingReasons_is_empty_when_nothing_is_open()
    {
        IReadOnlyList<string> reasons = FinalizeQualityScorecardEvaluator.GetBlockingReasons(
            FinalizeQualityScorecardCounts.Empty,
            new FinalizeQualityGateOptions());

        reasons.Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_emits_ui_copy_in_ui_order()
    {
        FinalizeQualityScorecardCounts counts = new(
            BlockingFindingCount: 1,
            UncoveredMandatoryRequirementCount: 1,
            OpenDeferredCount: 0,
            OpenContradictionCount: 0,
            OpenCannotDetermineCount: 2,
            OpenVerifyHypothesisCount: 0,
            UnverifiedAssumptionCount: 3,
            LowExtractionConfidenceCount: 1,
            UnresolvedHighSeverityDispositionCount: 4);

        IReadOnlyList<string> reasons = FinalizeQualityScorecardEvaluator.GetBlockingReasons(
            counts,
            new FinalizeQualityGateOptions());

        reasons.Should().Equal(
            "1 unresolved blocking finding still need disposition.",
            "1 mandatory requirement lack a design decision.",
            "2 open questions still need answers before the package is defensible.",
            "3 unverified assumptions remain — confirm or caveat existential ones before finalize.",
            "1 critical model field were extracted with low confidence — caveat or re-ingest before sponsor export.",
            "4 high-severity findings still need an accepted-risk disposition or decision-register row before finalize.");
    }

    [Fact]
    public void GetBlockingReasons_pluralises_like_the_ui()
    {
        FinalizeQualityScorecardCounts counts = new(0, 2, 0, 0, 1, 0, 0, 2, 1);

        IReadOnlyList<string> reasons = FinalizeQualityScorecardEvaluator.GetBlockingReasons(
            counts,
            new FinalizeQualityGateOptions());

        reasons.Should().Equal(
            "2 mandatory requirements lack a design decision.",
            "1 open question still need answers before the package is defensible.",
            "2 critical model fields were extracted with low confidence — caveat or re-ingest before sponsor export.",
            "1 high-severity finding still need an accepted-risk disposition or decision-register row before finalize.");
    }

    [Fact]
    public void GetBlockingReasons_applies_unverified_assumption_threshold()
    {
        FinalizeQualityScorecardCounts twoOpen = new(0, 0, 0, 0, 0, 0, 2, 0, 0);
        FinalizeQualityScorecardCounts threeOpen = new(0, 0, 0, 0, 0, 0, 3, 0, 0);

        FinalizeQualityScorecardEvaluator.GetBlockingReasons(twoOpen, new FinalizeQualityGateOptions())
            .Should().BeEmpty();
        FinalizeQualityScorecardEvaluator.GetBlockingReasons(threeOpen, new FinalizeQualityGateOptions())
            .Should().ContainSingle();
        FinalizeQualityScorecardEvaluator
            .GetBlockingReasons(twoOpen, new FinalizeQualityGateOptions { UnverifiedAssumptionBlockThreshold = 2 })
            .Should().ContainSingle();
    }

    [Fact]
    public void GetBlockingReasons_disables_assumption_check_when_threshold_is_below_one()
    {
        FinalizeQualityScorecardCounts manyOpen = new(0, 0, 0, 0, 0, 0, 50, 0, 0);
        FinalizeQualityGateOptions options = new() { UnverifiedAssumptionBlockThreshold = 0 };

        FinalizeQualityScorecardEvaluator.GetBlockingReasons(manyOpen, options).Should().BeEmpty();
    }

    [Fact]
    public void Compute_and_GetBlockingReasons_reject_null_arguments()
    {
        FinalizeQualityGateOptions options = new();
        Action nullRequest = () => FinalizeQualityScorecardEvaluator.Compute(null!, new FindingsSnapshot(), NoDispositions, options);
        Action nullFindings = () => FinalizeQualityScorecardEvaluator.Compute(new ArchitectureRequest(), null!, NoDispositions, options);
        Action nullDispositions = () => FinalizeQualityScorecardEvaluator.Compute(new ArchitectureRequest(), new FindingsSnapshot(), null!, options);
        Action nullOptions = () => FinalizeQualityScorecardEvaluator.Compute(new ArchitectureRequest(), new FindingsSnapshot(), NoDispositions, null!);
        Action nullCounts = () => FinalizeQualityScorecardEvaluator.GetBlockingReasons(null!, options);
        Action nullReasonOptions = () => FinalizeQualityScorecardEvaluator.GetBlockingReasons(FinalizeQualityScorecardCounts.Empty, null!);

        nullRequest.Should().Throw<ArgumentNullException>();
        nullFindings.Should().Throw<ArgumentNullException>();
        nullDispositions.Should().Throw<ArgumentNullException>();
        nullOptions.Should().Throw<ArgumentNullException>();
        nullCounts.Should().Throw<ArgumentNullException>();
        nullReasonOptions.Should().Throw<ArgumentNullException>();
    }

    private static FinalizeQualityScorecardCounts Compute(
        List<Finding> findings,
        IReadOnlyDictionary<string, FindingDisposition>? dispositions = null)
    {
        return FinalizeQualityScorecardEvaluator.Compute(
            new ArchitectureRequest(),
            new FindingsSnapshot { Findings = findings },
            dispositions ?? NoDispositions,
            new FinalizeQualityGateOptions());
    }

    private static Finding NewFinding(string title, FindingSeverity severity)
    {
        Finding finding = new()
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Title = title,
            Rationale = string.Empty,
            Severity = severity,
            FindingType = "test",
            Category = "test",
            EngineType = "test",
        };

        finding.EvidenceRefs.Add("doc-1");

        return finding;
    }
}
