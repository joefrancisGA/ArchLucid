using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class InfrastructureDeclarationsPayloadExtractor : IConnectorInput<InfrastructureDeclarationsPayload>
{
    public InfrastructureDeclarationsPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new InfrastructureDeclarationsPayload
        {
            InfrastructureDeclarations = request.InfrastructureDeclarations.ToList()
        };
    }
}
