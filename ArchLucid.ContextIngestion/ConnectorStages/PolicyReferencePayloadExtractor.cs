using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class PolicyReferencePayloadExtractor : IConnectorInput<PolicyReferencePayload>
{
    public PolicyReferencePayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new PolicyReferencePayload
        {
            PolicyReferences = request.PolicyReferences.ToList(), TopologyHints = request.TopologyHints.ToList()
        };
    }
}
