using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;

using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxSupplementalSectionsAppendixTests
{
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
