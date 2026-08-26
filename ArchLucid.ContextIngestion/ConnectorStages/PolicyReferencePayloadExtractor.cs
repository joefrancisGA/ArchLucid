using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class PolicyReferencePayloadExtractor : IConnectorInput<PolicyReferencePayload>
{
    public PolicyReferencePayload Extract(ContextIngestionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        HashSet<string> seenHints = new(StringComparer.OrdinalIgnoreCase);
        List<string> topologyHints = [];

        foreach (string hint in request.TopologyHints)
            AddTopologyHint(topologyHints, seenHints, hint);

        foreach (ContextDocumentReference document in request.Documents)
        {
            foreach (string hint in PlainTextDocumentTopologyHintExtractor.EnumerateHintNames(document.Content))
                AddTopologyHint(topologyHints, seenHints, hint);
        }

        return new PolicyReferencePayload
        {
            PolicyReferences = request.PolicyReferences.ToList(),
            TopologyHints = topologyHints
        };
    }

    private static void AddTopologyHint(List<string> topologyHints, HashSet<string> seenHints, string hint)
    {
        string trimmed = hint.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
            return;

        string canonicalHint = TopologyHintStableObjectIds.CanonicalizeHintName(trimmed).ToLowerInvariant();

        if (!seenHints.Add(canonicalHint))
            return;

        topologyHints.Add(trimmed);
    }
}
