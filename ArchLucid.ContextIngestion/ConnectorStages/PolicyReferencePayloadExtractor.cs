using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class PolicyReferencePayloadExtractor : IConnectorInput<PolicyReferencePayload>
{
    public PolicyReferencePayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<string> topologyHints = request.TopologyHints.ToList();

        foreach (ContextDocumentReference document in request.Documents)
        {
            foreach (string hint in PlainTextDocumentTopologyHintExtractor.EnumerateHintNames(document.Content))
                topologyHints.Add(hint);
        }

        return new PolicyReferencePayload
        {
            PolicyReferences = request.PolicyReferences.ToList(),
            TopologyHints = topologyHints
        };
    }
}
