using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExplanationFaithfulnessCheckerTests
{
    private readonly ExplanationFaithfulnessChecker _sut = new();

    [Fact]
    public void CheckFaithfulness_null_snapshot_returns_vacuous_one()
    {
        ExplanationResult explanation = new()
        {
            Summary = "Anything."
        };

        ExplanationFaithfulnessReport r = _sut.CheckFaithfulness(explanation, null);

        r.ClaimsChecked.Should().Be(0);
        r.SupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void CheckFaithfulness_empty_findings_returns_vacuous_one()
    {
        ExplanationResult explanation = new()
        {
            Summary = "Anything."
        };
        FindingsSnapshot snap = new()
        {
            Findings = []
        };

        ExplanationFaithfulnessReport r = _sut.CheckFaithfulness(explanation, snap);

        r.ClaimsChecked.Should().Be(0);
        r.SupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void CheckFaithfulness_token_in_RulesApplied_counts_supported()
    {
        // Single hyphenated token: avoids extra explanation words ("applies", "workload") that are not in the trace corpus.
        ExplanationResult explanation = new()
        {
            Summary = "custom-rule-xyz",
        };

        FindingsSnapshot snap = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingType = "t",
                    Category = "c",
                    EngineType = "e",
                    Title = "t",
                    Rationale = "r",
                    Trace = new ExplainabilityTrace { RulesApplied = ["custom-rule-xyz"] },
                },
            ],
        };

        ExplanationFaithfulnessReport r = _sut.CheckFaithfulness(explanation, snap);

        r.ClaimsChecked.Should().BeGreaterThan(0);
        r.ClaimsSupported.Should().Be(r.ClaimsChecked);
        r.SupportRatio.Should().Be(1.0);
        r.UnsupportedClaims.Should().BeEmpty();
    }

    [Fact]
    public void CheckFaithfulness_unknown_token_lists_unsupported()
    {
        ExplanationResult explanation = new()
        {
            Summary = "qwertyunknownbad marker is required.",
        };

        FindingsSnapshot snap = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingType = "t",
                    Category = "c",
                    EngineType = "e",
                    Title = "t",
                    Rationale = "r",
                    Trace = new ExplainabilityTrace { RulesApplied = ["other"] },
                },
            ],
        };

        ExplanationFaithfulnessReport r = _sut.CheckFaithfulness(explanation, snap);

        r.ClaimsUnsupported.Should().BeGreaterThan(0);
        r.SupportRatio.Should().BeLessThan(1.0);
        r.UnsupportedClaims.Should().Contain("qwertyunknownbad");
    }
}
