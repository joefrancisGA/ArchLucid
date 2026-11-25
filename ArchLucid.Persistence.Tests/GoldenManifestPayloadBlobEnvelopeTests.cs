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
            """["requirements"]""",
            """{"topology":1}""",
            """{"security":2}""",
            """{"compliance":3}""",
            """{"cost":4}""",
            """{"constraints":5}""",
            """["unresolved"]""",
            """["decisions"]""",
            """["assumptions"]""",
            """["warnings"]""",
            """{"provenance":6}""",
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
        merged.RequirementsJson.Should().Be("""["requirements"]""");
        merged.TopologyJson.Should().Be("""{"topology":1}""");
        merged.SecurityJson.Should().Be("""{"security":2}""");
        merged.ComplianceJson.Should().Be("""{"compliance":3}""");
        merged.CostJson.Should().Be("""{"cost":4}""");
        merged.ConstraintsJson.Should().Be("""{"constraints":5}""");
        merged.UnresolvedIssuesJson.Should().Be("""["unresolved"]""");
        merged.DecisionsJson.Should().Be("""["decisions"]""");
        merged.AssumptionsJson.Should().Be("""["assumptions"]""");
        merged.WarningsJson.Should().Be("""["warnings"]""");
        merged.ProvenanceJson.Should().Be("""{"provenance":6}""");
        merged.TenantId.Should().Be(row.TenantId);
        merged.WorkspaceId.Should().Be(row.WorkspaceId);
        merged.ProjectId.Should().Be(row.ProjectId);
        merged.RunId.Should().Be(row.RunId);
        merged.ContextSnapshotId.Should().Be(row.ContextSnapshotId);
        merged.GraphSnapshotId.Should().Be(row.GraphSnapshotId);
        merged.FindingsSnapshotId.Should().Be(row.FindingsSnapshotId);
        merged.DecisionTraceId.Should().Be(row.DecisionTraceId);
        merged.CreatedUtc.Should().Be(row.CreatedUtc);
        merged.ManifestHash.Should().Be(row.ManifestHash);
        merged.RuleSetId.Should().Be(row.RuleSetId);
        merged.RuleSetVersion.Should().Be(row.RuleSetVersion);
        merged.RuleSetHash.Should().Be(row.RuleSetHash);
        merged.ManifestId.Should().Be(row.ManifestId);
        merged.ManifestPayloadBlobUri.Should().Be("https://example/blob");
    }
}
