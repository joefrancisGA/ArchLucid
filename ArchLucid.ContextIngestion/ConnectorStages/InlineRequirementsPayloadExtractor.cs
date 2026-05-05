using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class InlineRequirementsPayloadExtractor : IConnectorInput<InlineRequirementsPayload>
{
    public InlineRequirementsPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new InlineRequirementsPayload { InlineRequirements = request.InlineRequirements.ToList() };
    }
}
