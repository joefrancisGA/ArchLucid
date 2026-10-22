using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class StaticRequestPayloadExtractor : IConnectorInput<StaticRequestPayload>
{
    public StaticRequestPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new StaticRequestPayload { Description = request.Description };
    }
}
