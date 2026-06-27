using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CitationIntegrityRunnerTests
{
    [Fact]
    public void SelectDeterministic_WithTenCommittedRuns_SelectsStableSample()
    {
        List<CitationIntegrityRunBundle> candidates = Enumerable.Range(1, 10)
            .Select(index => new CitationIntegrityRunBundle
            {
                RunId = $"run-{index:00}",
                Status = ArchitectureRunStatus.Committed,
                AgentResults = [],
            })
            .ToList();

        IReadOnlyList<CitationIntegrityRunBundle> first = CitationIntegritySampler.SelectDeterministic(candidates, 5);
        IReadOnlyList<CitationIntegrityRunBundle> second = CitationIntegritySampler.SelectDeterministic(candidates, 5);

        first.Select(static bundle => bundle.RunId).Should().Equal(second.Select(static bundle => bundle.RunId));
        first.Should().HaveCount(5);
        first.Select(static bundle => bundle.RunId).Should().BeInAscendingOrder();
    }

    [Fact]
    public void EvaluateRun_WithEvidenceBackedFinding_Passes()
    {
        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(null);
        CitationIntegrityRunBundle bundle = new()
        {
            RunId = "pass-run",
            Status = ArchitectureRunStatus.Committed,
            AgentResults =
            [
                new AgentResult
                {
                    ResultId = "r1",
                    AgentType = AgentType.Compliance,
                    EvidenceRefs = ["ev-1"],
                    Citations = [new Citation { SourceId = "POL-1", Description = "Mapped control policy." }],
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f1",
                            Category = "Compliance",
                            Severity = FindingSeverity.Warning,
                            EvidenceRefs = ["ev-1"],
                        },
                    ],
                },
            ],
        };

        CitationIntegrityRunResult result = CitationIntegrityEvaluator.EvaluateRun(bundle, rules);

        result.Verdict.Should().Be(CitationIntegrityVerdict.Pass);
        result.Issues.Should().BeEmpty();
    }

    [Fact]
    public void EvaluateRun_WithMissingEvidence_Fails()
    {
        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(null);
        CitationIntegrityRunBundle bundle = new()
        {
            RunId = "fail-run",
            Status = ArchitectureRunStatus.Committed,
            AgentResults =
            [
                new AgentResult
                {
                    ResultId = "r1",
                    AgentType = AgentType.Critic,
                    Claims = ["Policy citation must bind to repository evidence."],
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f1",
                            Category = "Critic",
                            Severity = FindingSeverity.Error,
                        },
                    ],
                },
            ],
        };

        CitationIntegrityRunResult result = CitationIntegrityEvaluator.EvaluateRun(bundle, rules);

        result.Verdict.Should().Be(CitationIntegrityVerdict.Fail);
        result.Issues.Should().Contain(static issue => issue.Verdict == CitationIntegrityVerdict.Fail);
    }

    [Fact]
    public void EvaluateRun_WithWeakCitationDescription_Warns()
    {
        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(null);
        CitationIntegrityRunBundle bundle = new()
        {
            RunId = "warn-run",
            Status = ArchitectureRunStatus.Committed,
            AgentResults =
            [
                new AgentResult
                {
                    ResultId = "r1",
                    AgentType = AgentType.Critic,
                    EvidenceRefs = ["ev-1"],
                    Citations = [new Citation { SourceId = "POL-1", Description = string.Empty }],
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f1",
                            Category = "Critic",
                            Severity = FindingSeverity.Warning,
                            EvidenceRefs = ["ev-1"],
                        },
                    ],
                },
            ],
        };

        CitationIntegrityRunResult result = CitationIntegrityEvaluator.EvaluateRun(bundle, rules);

        result.Verdict.Should().Be(CitationIntegrityVerdict.Warn);
        result.Issues.Should().Contain(static issue => issue.Verdict == CitationIntegrityVerdict.Warn);
    }

    [Fact]
    public void RunOffline_WithRepositoryFixtures_ReportsPassWarnFail()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(null);
        CitationIntegrityRunner runner = new();
        CitationIntegrityReport report = runner.RunOffline(
            repositoryRoot!,
            new CitationIntegrityOptions { SampleSize = 3 },
            rules);

        report.CommittedRunsConsidered.Should().Be(3);
        report.SampleSize.Should().Be(3);
        report.Runs.Should().Contain(static run => run.RunId == "cite-pass-run-01" && run.Verdict == CitationIntegrityVerdict.Pass);
        report.Runs.Should().Contain(static run => run.RunId == "cite-warn-run-01" && run.Verdict == CitationIntegrityVerdict.Warn);
        report.Runs.Should().Contain(static run => run.RunId == "cite-fail-run-01" && run.Verdict == CitationIntegrityVerdict.Fail);
        report.FailThresholdExceeded.Should().BeTrue();
        report.OverallVerdict.Should().Be(CitationIntegrityVerdict.Fail);
    }
}
