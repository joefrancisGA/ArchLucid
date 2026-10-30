using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerDocumentFactoryTests
{
    [Fact]
    public void Create_counts_severity_and_top_titles()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            Message = "Critical gap",
                            Category = "Security"
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Error,
                            Message = "High gap",
                            Category = "Reliability"
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Warning,
                            Message = "Medium gap",
                            Category = "Cost"
                        }
                    ]
                }
            ]
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary text.", ["Critical gap", "High gap", "Extra"]);

        model.CriticalCount.Should().Be(1);
        model.HighCount.Should().Be(1);
        model.MediumCount.Should().Be(1);
        model.LowCount.Should().Be(0);
        model.TopFindingTitles.Should().Equal("Critical gap", "High gap", "Extra");
    }

    [Fact]
    public void Create_preserves_all_provided_top_titles_not_only_three()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results = []
        };

        string[] titles = ["Finding 1", "Finding 2", "Finding 3", "Finding 4", "Finding 5"];

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary text.", titles);

        model.TopFindingTitles.Should().Equal(titles);
    }

    [Fact]
    public void Create_sets_display_fields_for_missing_system_name_and_run_id()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "" },
            Results = [],
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary.", []);

        model.SystemNameDisplay.Should().Be(RunSummaryOnePagerHonestyCopy.SystemNameNotStored);
        model.RunIdDisplay.Should().Be(RunSummaryOnePagerHonestyCopy.RunIdStoredEmpty);
        model.SealedFindingsSection.Should().Be(RunSummaryOnePagerHonestyCopy.FindingsSnapshotIdNotStored);
    }

    [Fact]
    public void Create_excludes_muted_findings_from_severity_counts()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            Message = "Muted critical",
                            IsMuted = true,
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Error,
                            Message = "Active high",
                        },
                    ],
                },
            ],
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary.", []);

        model.CriticalCount.Should().Be(0);
        model.HighCount.Should().Be(1);
        model.MutedFindingCount.Should().Be(1);
        model.SeverityCountsFootnote.Should().Contain("Muted findings are excluded");
    }

    [Fact]
    public void Create_sets_top_findings_empty_copy_when_no_titles()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results = [],
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary.", []);

        model.TopFindingsEmptyCopy.Should().Be(RunSummaryOnePagerHonestyCopy.NoCriticalOrErrorFindingTitles);
    }

    [Fact]
    public void Create_labels_agent_findings_not_stored_when_results_are_null()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            AgentResultsIncludedInDetail = false,
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary.", []);

        model.AgentFindingsCountsStored.Should().BeFalse();
        model.AgentFindingsNotStoredCopy.Should().Be(RunSummaryOnePagerHonestyCopy.AgentFindingsNotStored);
        model.CriticalCount.Should().Be(0);
    }

    [Fact]
    public void SelectTopHighCriticalFindings_excludes_muted_findings()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            Message = "Muted critical",
                            IsMuted = true,
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Error,
                            Message = "Active high",
                        },
                    ],
                },
            ],
        };

        IReadOnlyList<ArchitectureFinding> top =
            RunSummaryOnePagerDocumentFactory.SelectTopHighCriticalFindings(detail, maxCount: 5);

        top.Should().ContainSingle();
        top[0].Message.Should().Be("Active high");
    }

    [Fact]
    public void Create_sets_top_high_critical_remainder_line_when_export_lists_subset()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun { RunId = "run-1" },
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding { Severity = FindingSeverity.Critical, Message = "One" },
                        new ArchitectureFinding { Severity = FindingSeverity.Error, Message = "Two" },
                        new ArchitectureFinding { Severity = FindingSeverity.Error, Message = "Three" },
                    ],
                },
            ],
        };

        RunSummaryOnePagerDocumentModel model =
            RunSummaryOnePagerDocumentFactory.Create(detail, "Summary.", ["One"]);

        model.TopHighCriticalRemainderLine.Should().Contain("2 more Critical or Error finding(s)");
    }
}
