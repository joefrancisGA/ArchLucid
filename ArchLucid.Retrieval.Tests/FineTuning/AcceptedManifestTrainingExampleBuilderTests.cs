using ArchLucid.Core.Manifest;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class AcceptedManifestTrainingExampleBuilderTests
{
    [Fact]
    public void BuildRecords_redacts_email_in_rationale()
    {
        ManifestDocument manifest = FineTuningTestFixtures.CreateSampleManifest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            rationale: "Use email owner@contoso.com for alerts.");

        IReadOnlyList<FineTuningTrainingRecord> records =
            AcceptedManifestTrainingExampleBuilder.BuildRecords(manifest, FineTuningTestFixtures.CreateRedactor());

        records.Should().ContainSingle();
        records[0].AssistantCompletion.Should().NotContain("owner@contoso.com");
        records[0].AssistantCompletion.Should().Contain("[REDACTED]");
    }
}
