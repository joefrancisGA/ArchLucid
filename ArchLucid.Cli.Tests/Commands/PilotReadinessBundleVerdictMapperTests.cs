using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Commands;

[Trait("Suite", "Core")]
public sealed class PilotReadinessBundleVerdictMapperTests
{
    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Warn", "Warn")]
    [InlineData("Fail", "Fail")]
    public void FromBuyerProof_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromBuyerProof(Parse<BuyerProofEvidenceLedgerVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromBuyerProof_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromBuyerProof((BuyerProofEvidenceLedgerVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Warn", "Warn")]
    [InlineData("Fail", "Fail")]
    public void FromReturnTrigger_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromReturnTrigger(Parse<ReturnTriggerTelemetryVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromReturnTrigger_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromReturnTrigger((ReturnTriggerTelemetryVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Warn", "Warn")]
    [InlineData("Fail", "Fail")]
    public void FromDecisionOwner_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromDecisionOwner(Parse<DecisionOwnerScoreboardVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromDecisionOwner_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromDecisionOwner((DecisionOwnerScoreboardVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Warn", "Warn")]
    [InlineData("Fail", "Fail")]
    public void FromFrontierAi_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromFrontierAi(Parse<FrontierAiBaselineVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromFrontierAi_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromFrontierAi((FrontierAiBaselineVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Warn", "Warn")]
    [InlineData("Fail", "Fail")]
    public void FromCitation_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromCitation(Parse<CitationIntegrityVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromCitation_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromCitation((CitationIntegrityVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Fail", "Fail")]
    [InlineData("Skip", "Skipped")]
    public void FromTenantIsolation_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromTenantIsolation(Parse<TenantIsolationNegativeTestVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromTenantIsolation_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromTenantIsolation((TenantIsolationNegativeTestVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("Pass", "Pass")]
    [InlineData("Fail", "Fail")]
    [InlineData("Unknown", "Unknown")]
    public void FromShipGate_maps_known_verdicts(string input, string expected)
    {
        PilotReadinessBundleVerdictMapper.FromShipGate(Parse<ShipGateEvidenceVerdict>(input))
            .ToString()
            .Should()
            .Be(expected);
    }

    [Fact]
    public void FromShipGate_throws_for_unknown_verdict()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromShipGate((ShipGateEvidenceVerdict)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void FromItsmPullForward_throws_for_null_report()
    {
        Action act = () => PilotReadinessBundleVerdictMapper.FromItsmPullForward(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void FromItsmPullForward_fails_when_any_check_reports_missing_evidence()
    {
        ItsmPullForwardReport report = BuildReport(
            ItsmPullForwardVerdict.Hold,
            [BuildCheck(ItsmPullForwardVerdict.Hold, "Missing ITSM connector configuration.")]);

        PilotReadinessBundleVerdictMapper.FromItsmPullForward(report).ToString().Should().Be("Fail");
    }

    [Theory]
    [InlineData("Hold", "Pass")]
    [InlineData("Watch", "Warn")]
    [InlineData("PullForward", "Fail")]
    public void FromItsmPullForward_maps_recommendation_when_evidence_is_present(string recommendation, string expected)
    {
        ItsmPullForwardVerdict parsedRecommendation = Parse<ItsmPullForwardVerdict>(recommendation);

        ItsmPullForwardReport report = BuildReport(
            parsedRecommendation,
            [BuildCheck(parsedRecommendation, "All connector checks passed.")]);

        PilotReadinessBundleVerdictMapper.FromItsmPullForward(report).ToString().Should().Be(expected);
    }

    private static TEnum Parse<TEnum>(string value) where TEnum : struct, Enum
    {
        return Enum.Parse<TEnum>(value);
    }

    private static ItsmPullForwardReport BuildReport(
        ItsmPullForwardVerdict recommendation,
        IReadOnlyList<ItsmPullForwardCheckResult> checks)
    {
        return new ItsmPullForwardReport
        {
            RepositoryRoot = "/tmp/repo",
            LedgerDirectory = "/tmp/repo/ledger",
            GeneratedUtc = DateTime.UtcNow,
            Recommendation = recommendation,
            Checks = checks,
            Triggers = new ItsmPullForwardTriggerCounts
            {
                ConnectorPrimaryBlockerPilotCount = 0,
                SowContingentOnConnectorCount = 0,
                ManualHandoffDominatesSecondReviewCount = 0,
            },
            LedgerFilesScanned = 0,
        };
    }

    private static ItsmPullForwardCheckResult BuildCheck(ItsmPullForwardVerdict verdict, string evidence)
    {
        return new ItsmPullForwardCheckResult { Name = "connector-check", Verdict = verdict, Evidence = evidence };
    }
}
