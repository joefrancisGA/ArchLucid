using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;

using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxSupplementalSectionsAppendixTests
{
    [Theory]
    [InlineData(true, false, false, 0)]
    [InlineData(false, true, false, 0)]
    [InlineData(true, true, false, 1)]
    [InlineData(true, false, true, 1)]
    [InlineData(false, true, true, 1)]
    [InlineData(true, true, true, 2)]
    public void AddAppendices_only_adds_page_breaks_between_enabled_appendices(
        bool includeMermaid,
        bool includeExecutionTraceIndex,
        bool includeDeterminismAndComparison,
        int expectedPageBreaks)
    {
        Body body = new();
        ConsultingDocxTemplateOptions options = new()
        {
            IncludeAppendixMermaid = includeMermaid,
            IncludeAppendixExecutionTraceIndex = includeExecutionTraceIndex,
            IncludeAppendixDeterminismAndComparison = includeDeterminismAndComparison,
        };

        ConsultingDocxSupplementalSections.AddAppendices(body, new ArchitectureAnalysisReport(), options);

        body.Descendants<Break>().Count(pageBreak => pageBreak.Type?.Value == BreakValues.Page)
            .Should().Be(expectedPageBreaks);
    }

    [Fact]
    public void Mermaid_appendix_preserves_mixed_line_endings_as_separate_paragraphs()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Diagram = "flowchart TD\rNodeA --> NodeB\r\nNodeB --> NodeC\nNodeC --> NodeD",
        };
        ConsultingDocxTemplateOptions options = new()
        {
            IncludeAppendixMermaid = true,
            IncludeAppendixExecutionTraceIndex = false,
            IncludeAppendixDeterminismAndComparison = false,
        };

        ConsultingDocxSupplementalSections.AddAppendices(body, report, options);

        body.Elements<Paragraph>().Select(paragraph => paragraph.InnerText).Should().Equal(
            "Appendix A. Mermaid Source",
            "[mermaid]",
            "flowchart TD",
            "NodeA --> NodeB",
            "NodeB --> NodeC",
            "NodeC --> NodeD");
    }

    [Fact]
    public void AddAppendices_includes_datastore_relationship_and_warning_manifest_counts()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            ManifestDiff = new ManifestDiffResult
            {
                AddedDatastores = ["ledger-db"],
                AddedRelationships =
                [
                    new RelationshipDiffItem
                    {
                        SourceId = "api",
                        TargetId = "db",
                        RelationshipType = "reads"
                    }
                ],
                Warnings = ["SystemName differs between compared manifests."],
            }
        };

        ConsultingDocxTemplateOptions options = new() { IncludeAppendixDeterminismAndComparison = true };

        ConsultingDocxSupplementalSections.AddAppendices(body, report, options);

        string text = body.InnerText;

        text.Should().Contain("Added Datastores: 1");
        text.Should().Contain("Added Relationships: 1");
        text.Should().Contain("Manifest Warnings: 1");
    }

    [Fact]
    public void AddAppendices_uses_not_stored_copy_for_empty_appendix_sections()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new();
        ConsultingDocxTemplateOptions options = new()
        {
            IncludeAppendixMermaid = true,
            IncludeAppendixExecutionTraceIndex = true,
            IncludeAppendixDeterminismAndComparison = true,
        };

        ConsultingDocxSupplementalSections.AddAppendices(body, report, options);

        string text = body.InnerText;

        text.Should().Contain(ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored);
        text.Should().Contain(ConsultingDocxAppendixHonestyCopy.ExecutionTraceIndexNotStored);
        text.Should().Contain(ConsultingDocxAppendixHonestyCopy.DeterminismCheckNotStored);
        text.Should().Contain(ConsultingDocxAppendixHonestyCopy.ManifestDiffNotStored);
        text.Should().Contain(ConsultingDocxAppendixHonestyCopy.AgentResultDiffNotStored);
    }
}
