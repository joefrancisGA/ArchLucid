using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class InfrastructureDeclarationsPayload
{
    public IReadOnlyList<InfrastructureDeclarationReference> InfrastructureDeclarations
    {
        get;
        init;
    } = [];
}
