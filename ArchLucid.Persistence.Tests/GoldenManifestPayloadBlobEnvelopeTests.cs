using System.Text.Json.Nodes;

using ArchLucid.Persistence.GoldenManifests;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GoldenManifestPayloadBlobEnvelopeTests
{
    [Theory]
    [InlineData("schemaVersion")]
    [InlineData("requirementsJson")]
    public void TryDeserialize_rejects_missing_required_fields(string field)
    {
        JsonObject payload = JsonNode.Parse(new GoldenManifestPayloadBlobEnvelope().ToJson())!.AsObject();
        payload.Remove(field);

        GoldenManifestPayloadBlobEnvelope.TryDeserialize(payload.ToJsonString()).Should().BeNull();
    }

    [SkippableFact]
    public void TryDeserialize_rejects_null_required_slices_and_accepts_older_optional_fields()
    {
        JsonObject payload = JsonNode.Parse(new GoldenManifestPayloadBlobEnvelope().ToJson())!.AsObject();
        payload.Remove("hasherBoundJson");
        payload.Remove("complianceJson");

        GoldenManifestPayloadBlobEnvelope.TryDeserialize(payload.ToJsonString()).Should().NotBeNull();

        payload["requirementsJson"] = null;

        GoldenManifestPayloadBlobEnvelope.TryDeserialize(payload.ToJsonString()).Should().BeNull();
    }

    [SkippableFact]
    public void RoundTrip_serializes_and_merges_into_row()
    {
        GoldenManifestPayloadBlobEnvelope original = GoldenManifestPayloadBlobEnvelope.FromSerializedSlices(
            """{"k":"m"}""",
            "[]",
            "{}",
            "{}",
            "{}",
            "{}",
            "{}",
            "[]",
            "[]",
            "[]",
            "[]",
            "{}",
            """{"policy":{"notes":["No public SQL endpoints"]}}""");

        string json = original.ToJson();
        GoldenManifestPayloadBlobEnvelope? parsed = GoldenManifestPayloadBlobEnvelope.TryDeserialize(json);
        parsed.Should().NotBeNull();
        parsed.MetadataJson.Should().Be("""{"k":"m"}""");

        GoldenManifestStorageRow row = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            MetadataJson = "old",
            RequirementsJson = "old",
            TopologyJson = "old",
            SecurityJson = "old",
            ComplianceJson = "old",
            CostJson = "old",
            ConstraintsJson = "old",
            UnresolvedIssuesJson = "old",
            DecisionsJson = "old",
            AssumptionsJson = "old",
            WarningsJson = "old",
            ProvenanceJson = "old",
            ManifestPayloadBlobUri = "https://example/blob"
        };

        GoldenManifestStorageRow merged = GoldenManifestPayloadBlobEnvelope.MergeIntoRow(row, parsed!);
        merged.MetadataJson.Should().Be("""{"k":"m"}""");
        merged.HasherBoundJson.Should().Contain("No public SQL endpoints");
        merged.HasherBoundJson.Should().Be(parsed.HasherBoundJson);
        merged.ManifestId.Should().Be(row.ManifestId);
        merged.ManifestPayloadBlobUri.Should().Be("https://example/blob");
    }
}
