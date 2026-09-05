using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Services;
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
            payload.HasherBoundJson,
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
        roundTripped.HasherBoundJson.Should().Be(payload.HasherBoundJson);
    }

    [Fact]
    public void Hasher_bound_policy_notes_survive_payload_round_trip_and_keep_sealed_hash()
    {
        ManifestHashService hasher = new();
        Guid runId = Guid.Parse("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501");
        ManifestDocument original = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ManifestId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            RunId = runId,
            ContextSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            GraphSnapshotId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            FindingsSnapshotId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            DecisionTraceId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
            RuleSetId = "archlucid.authority.demo-seed",
            RuleSetVersion = "1",
            RuleSetHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000",
            Policy =
            {
                Notes =
                [
                    "No public SQL endpoints",
                    "Secrets in Key Vault only",
                ]
            }
        };
        original.ManifestHash = hasher.ComputeHash(original);

        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(original);
        payload.HasherBoundJson.Should().Contain("No public SQL endpoints");

        ManifestDocument hydrated = new()
        {
            TenantId = original.TenantId,
            WorkspaceId = original.WorkspaceId,
            ProjectId = original.ProjectId,
            ManifestId = original.ManifestId,
            RunId = original.RunId,
            ContextSnapshotId = original.ContextSnapshotId,
            GraphSnapshotId = original.GraphSnapshotId,
            FindingsSnapshotId = original.FindingsSnapshotId,
            DecisionTraceId = original.DecisionTraceId,
            CreatedUtc = original.CreatedUtc,
            ManifestHash = original.ManifestHash,
            RuleSetId = original.RuleSetId,
            RuleSetVersion = original.RuleSetVersion,
            RuleSetHash = original.RuleSetHash,
        };
        GoldenManifestHasherBoundPayload.ApplyJsonToDocument(payload.HasherBoundJson, hydrated);

        hasher.ComputeHash(hydrated).Should().Be(original.ManifestHash);
        hydrated.Policy.Notes.Should().Equal(original.Policy.Notes);
    }
}
