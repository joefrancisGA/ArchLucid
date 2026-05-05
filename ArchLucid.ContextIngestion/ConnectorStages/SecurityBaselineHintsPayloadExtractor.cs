using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class SecurityBaselineHintsPayloadExtractor : IConnectorInput<SecurityBaselineHintsPayload>
{
    public SecurityBaselineHintsPayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new SecurityBaselineHintsPayload { SecurityBaselineHints = request.SecurityBaselineHints.ToList() };
    }
}
