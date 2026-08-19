using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.GoldenManifests;

/// <summary>
///     The twelve serialized manifest payload slices written to <c>dbo.GoldenManifests</c>.
/// </summary>
/// <remarks>
///     Serialization happens once and is reused for the size check, the optional blob envelope, and the insert
///     parameters — the slices are large enough (NVARCHAR(MAX) JSON) that re-serializing per use is worth avoiding.
/// </remarks>
internal sealed record GoldenManifestSerializedPayload(
    string MetadataJson,
    string RequirementsJson,
    string TopologyJson,
    string SecurityJson,
    string ComplianceJson,
    string CostJson,
    string ConstraintsJson,
    string UnresolvedIssuesJson,
    string DecisionsJson,
    string AssumptionsJson,
    string WarningsJson,
    string ProvenanceJson)
{
    public static GoldenManifestSerializedPayload FromDocument(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return new GoldenManifestSerializedPayload(
            JsonEntitySerializer.Serialize(manifest.Metadata),
            JsonEntitySerializer.Serialize(manifest.Requirements),
            JsonEntitySerializer.Serialize(manifest.Topology),
            JsonEntitySerializer.Serialize(manifest.Security),
            JsonEntitySerializer.Serialize(manifest.Compliance),
            JsonEntitySerializer.Serialize(manifest.Cost),
            JsonEntitySerializer.Serialize(manifest.Constraints),
            JsonEntitySerializer.Serialize(manifest.UnresolvedIssues),
            JsonEntitySerializer.Serialize(manifest.Decisions),
            JsonEntitySerializer.Serialize(manifest.Assumptions),
            JsonEntitySerializer.Serialize(manifest.Warnings),
            JsonEntitySerializer.Serialize(manifest.Provenance));
    }

    /// <summary>Combined UTF-16 length, compared against the offload threshold before writing in-row JSON.</summary>
    public int TotalUtf16Length => GoldenManifestPayloadBlobEnvelope.SumUtf16Length(
        MetadataJson,
        RequirementsJson,
        TopologyJson,
        SecurityJson,
        ComplianceJson,
        CostJson,
        ConstraintsJson,
        UnresolvedIssuesJson,
        DecisionsJson,
        AssumptionsJson,
        WarningsJson,
        ProvenanceJson);

    public GoldenManifestPayloadBlobEnvelope ToBlobEnvelope() =>
        GoldenManifestPayloadBlobEnvelope.FromSerializedSlices(
            MetadataJson,
            RequirementsJson,
            TopologyJson,
            SecurityJson,
            ComplianceJson,
            CostJson,
            ConstraintsJson,
            UnresolvedIssuesJson,
            DecisionsJson,
            AssumptionsJson,
            WarningsJson,
            ProvenanceJson);
}
