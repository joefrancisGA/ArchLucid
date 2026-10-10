using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class FirstValueReportMissingValueFormatterTests
{
    [Fact]
    public void AppendComputedDeltasSection_labels_missing_commit_duration_as_not_stored()
    {
        StringBuilder markdown = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            markdown,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = null,
                FindingsBySeverity = [],
            });

        markdown.ToString().Should().Contain("Time to committed manifest was not stored.");
        markdown.ToString().Should().NotContain("pending");
    }

    [Fact]
    public void AppendMarkdownSection_labels_missing_manifest_as_not_stored()
    {
        StringBuilder markdown = new();
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(
            markdown,
            new ArchitectureRun
            {
                RunId = "run-1",
                Status = ArchitectureRunStatus.Created,
                RequestId = "request-1",
                CreatedUtc = DateTime.UtcNow,
            },
            null,
            "https://app.example");

        markdown.ToString().Should().Contain("Committed manifest was not stored.");
    }
}
