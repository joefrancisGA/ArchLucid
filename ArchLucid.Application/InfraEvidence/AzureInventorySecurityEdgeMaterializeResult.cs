using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventorySecurityEdgeMaterializeResult
{
    public IReadOnlyList<AzureInventoryResourceRelationshipWrite> Relationships
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> CompletenessWarnings
    {
        get;
        init;
    } = [];
}
