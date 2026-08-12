using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.GoldenManifests;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.GoldenManifests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestSerializedPayloadTests
{
    [Fact]
    public void FromDocument_serializes_every_payload_slice()
    {
        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(new ManifestDocument());

        new[]
        {
            payload.MetadataJson,
            payload.RequirementsJson,
            payload.TopologyJson,
            payload.SecurityJson,
            payload.ComplianceJson,
            payload.CostJson,
            payload.ConstraintsJson,
            payload.UnresolvedIssuesJson,
            payload.DecisionsJson,
            payload.AssumptionsJson,
            payload.WarningsJson,
            payload.ProvenanceJson,
        }.Should().OnlyContain(static slice => !string.IsNullOrWhiteSpace(slice));
    }

    [Fact]
    public void FromDocument_carries_document_content_into_its_slice()
    {
        ManifestDocument manifest = new();
        manifest.Warnings.Add("cost ceiling exceeded");

        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(manifest);

        payload.WarningsJson.Should().Contain("cost ceiling exceeded");
    }

    /// <summary>
    ///     The total is what the offload threshold is compared against, so it has to grow with the payload rather than
    ///     measuring a single slice.
    /// </summary>
    [Fact]
    public void TotalUtf16Length_grows_with_added_content()
    {
        ManifestDocument manifest = new();
        int emptyLength = GoldenManifestSerializedPayload.FromDocument(manifest).TotalUtf16Length;

        manifest.Assumptions.Add(new string('a', 4_096));

        GoldenManifestSerializedPayload.FromDocument(manifest)
            .TotalUtf16Length.Should()
            .BeGreaterThan(emptyLength + 4_000);
    }

    [Fact]
    public void ToBlobEnvelope_round_trips_through_the_current_schema_version()
    {
        ManifestDocument manifest = new();
        manifest.Assumptions.Add("offloaded assumption");

        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(manifest);
        GoldenManifestPayloadBlobEnvelope? roundTripped =
            GoldenManifestPayloadBlobEnvelope.TryDeserialize(payload.ToBlobEnvelope().ToJson());

        roundTripped.Should().NotBeNull();
        roundTripped!.SchemaVersion.Should().Be(GoldenManifestPayloadBlobEnvelope.CurrentSchemaVersion);
        roundTripped.AssumptionsJson.Should().Be(payload.AssumptionsJson);
    }
}
