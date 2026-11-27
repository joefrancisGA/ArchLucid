using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryResourceRelationshipWrite
{
    public string FromAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ToAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string RelationshipType
    {
        get;
        init;
    } = string.Empty;

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public decimal? Confidence
    {
        get;
        init;
    }

    public string? InferenceSource
    {
        get;
        init;
    }
}
