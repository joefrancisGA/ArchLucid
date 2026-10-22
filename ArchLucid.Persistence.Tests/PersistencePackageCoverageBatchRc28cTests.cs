using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     RC28c package-coverage batch: artifact bundle blob envelope helpers and architecture-run list DTO (merged
///     coverage lift; package gate skipped).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatchRc28cTests
{
    [Fact]
    public void ArtifactBundlePayloadBlobEnvelope_FromJsonPair_and_round_trip()
    {
        ArtifactBundlePayloadBlobEnvelope envelope = ArtifactBundlePayloadBlobEnvelope.FromJsonPair("[]", "{}");

        envelope.SchemaVersion.Should().Be(ArtifactBundlePayloadBlobEnvelope.CurrentSchemaVersion);
        envelope.ArtifactsJson.Should().Be("[]");
        envelope.TraceJson.Should().Be("{}");

        string json = envelope.ToJson();
        ArtifactBundlePayloadBlobEnvelope? parsed = ArtifactBundlePayloadBlobEnvelope.TryDeserialize(json);

        parsed.Should().NotBeNull();
        parsed!.ArtifactsJson.Should().Be("[]");
        parsed.TraceJson.Should().Be("{}");
        ArtifactBundlePayloadBlobEnvelope.SumUtf16Length(parsed.ArtifactsJson, parsed.TraceJson)
            .Should().Be("[]".Length + "{}".Length);
    }

    [Fact]
    public void ArchitectureRunListItem_property_bag_round_trip()
    {
        ArchitectureRunListItem item = new()
        {
            RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            RequestId = "req-1",
            Status = "Committed",
            CreatedUtc = DateTime.Parse("2026-08-01T00:00:00Z").ToUniversalTime(),
            SystemName = "payments",
        };

        item.RunId.Should().NotBeNullOrWhiteSpace();
        item.Status.Should().Be("Committed");
        item.SystemName.Should().Be("payments");
        item.CreatedUtc.Year.Should().Be(2026);
    }
}
