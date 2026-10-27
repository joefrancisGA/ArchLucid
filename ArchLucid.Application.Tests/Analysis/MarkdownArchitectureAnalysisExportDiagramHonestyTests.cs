using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class MarkdownArchitectureAnalysisExportDiagramHonestyTests
{
    [Fact]
    public void GenerateMarkdown_includes_mermaid_not_stored_when_diagram_missing()
    {
        MarkdownArchitectureAnalysisExportService sut = new();
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Manifest = new GoldenManifest { SystemName = "Sys", RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
        };

        string md = sut.GenerateMarkdown(report);

        md.Should().Contain("## Diagram");
        md.Should().Contain(ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored);
        md.Should().NotContain("```mermaid");
    }
}
