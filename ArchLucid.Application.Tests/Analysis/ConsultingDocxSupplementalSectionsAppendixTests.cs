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
}
