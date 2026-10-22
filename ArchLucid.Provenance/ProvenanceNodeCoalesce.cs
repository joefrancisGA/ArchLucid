namespace ArchLucid.Provenance;

internal static class ProvenanceNodeCoalesce
{
    internal static void ApplyMergedFields(ProvenanceNode existingNode, ProvenanceNode incomingNode)
    {
        ArgumentNullException.ThrowIfNull(existingNode);
        ArgumentNullException.ThrowIfNull(incomingNode);

        if (!string.IsNullOrWhiteSpace(incomingNode.Name)
            && !ShouldSkipGraphNodeNameDowngrade(existingNode, incomingNode))
        {
            existingNode.Name = incomingNode.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(incomingNode.ReferenceId))
            existingNode.ReferenceId = NormalizeId(incomingNode.ReferenceId);

        if (!string.IsNullOrWhiteSpace(incomingNode.AgentExecutionTraceId))
        {
            string traceId = incomingNode.AgentExecutionTraceId.Trim();
            existingNode.AgentExecutionTraceId = traceId;
            existingNode.Metadata[ProvenanceMetadataKeys.AgentExecutionTraceId] = traceId;
        }

        foreach (KeyValuePair<string, string> entry in incomingNode.Metadata)
        {
            if (!string.IsNullOrWhiteSpace(entry.Value))
                existingNode.Metadata[entry.Key] = NormalizeMetadataValue(entry.Value);
        }
    }

    internal static bool ShouldSkipGraphNodeNameDowngrade(ProvenanceNode existingNode, ProvenanceNode incomingNode)
    {
        if (existingNode.Type != incomingNode.Type
            || (existingNode.Type != ProvenanceNodeType.GraphNode
                && existingNode.Type != ProvenanceNodeType.Finding
                && existingNode.Type != ProvenanceNodeType.Decision
                && existingNode.Type != ProvenanceNodeType.Artifact))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(existingNode.Name)
            || string.IsNullOrWhiteSpace(incomingNode.Name)
            || string.IsNullOrWhiteSpace(incomingNode.ReferenceId))
        {
            return false;
        }

        string incomingName = incomingNode.Name.Trim();
        string incomingReferenceId = incomingNode.ReferenceId.Trim();
        string existingName = existingNode.Name.Trim();
        string existingReferenceId = existingNode.ReferenceId.Trim();

        bool incomingNameIsReferenceId = string.Equals(
            incomingName,
            incomingReferenceId,
            StringComparison.OrdinalIgnoreCase);

        bool existingNameIsReferenceId = string.Equals(
            existingName,
            existingReferenceId,
            StringComparison.OrdinalIgnoreCase);

        return incomingNameIsReferenceId && !existingNameIsReferenceId;
    }

    private static string NormalizeId(string id) => id.Trim();

    private static string NormalizeMetadataValue(string value) => value.Trim();
}
