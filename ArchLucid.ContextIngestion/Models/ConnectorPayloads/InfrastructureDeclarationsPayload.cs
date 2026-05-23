using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class InfrastructureDeclarationsPayload
{
    public IReadOnlyList<InfrastructureDeclarationReference> InfrastructureDeclarations
    {
        get;
        init;
    } = [];
}
