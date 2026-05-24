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
}
