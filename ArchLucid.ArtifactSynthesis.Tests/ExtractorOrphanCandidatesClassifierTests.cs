using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExtractorOrphanCandidatesClassifierTests
{
    [Fact]
    public void ClassifyFromOrphanCandidatesJson_reads_candidates_array()
    {
        const string json =
            """
            {
              "candidates": [
                {
                  "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/d1",
                  "resourceType": "Microsoft.Compute/disks",
                  "reason": "Unattached disk",
                  "monthlySavingsUsd": 25
                }
              ]
            }
            """;

        IReadOnlyList<ExtractorOrphanCandidateFinding> findings =
            ExtractorOrphanCandidatesClassifier.ClassifyFromOrphanCandidatesJson(json);

        findings.Should().ContainSingle();
        findings[0].ResourceId.Should().Contain("disk");
        findings[0].EstimatedAnnualSavingsUsd.Should().Be(300m);
        findings[0].EntryIndex.Should().Be(0);
    }

    [Fact]
    public void ClassifyFromOrphanCandidatesJson_returns_empty_for_unknown_shape()
    {
        const string json = """{ "metadata": { "version": 1 } }""";

        IReadOnlyList<ExtractorOrphanCandidateFinding> findings =
            ExtractorOrphanCandidatesClassifier.ClassifyFromOrphanCandidatesJson(json);

        findings.Should().BeEmpty();
    }
}
