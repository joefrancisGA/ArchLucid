using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class TopologyHintsPayloadExtractor : IConnectorInput<TopologyHintsPayload>
{
    public TopologyHintsPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new TopologyHintsPayload { TopologyHints = request.TopologyHints.ToList() };
    }
}
