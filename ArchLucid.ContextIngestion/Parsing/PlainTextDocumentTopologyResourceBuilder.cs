using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.Parsing;

internal static class PlainTextDocumentTopologyResourceBuilder
{
    internal static CanonicalObject Create(string documentId, string canonicalHint)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase) { ["text"] = canonicalHint };

        int slash = canonicalHint.IndexOf('/');

        if (slash > 0 && slash < canonicalHint.Length - 1)
        {
            string parentName = canonicalHint[..slash];
            string childRemainder = canonicalHint[(slash + 1)..];

            if (parentName.Length > 0 && childRemainder.Length > 0)
            {
                string parentObjectId = TopologyHintStableObjectIds.FromHintName(parentName);
                properties["parentNodeId"] = $"obj-{parentObjectId}";
            }
        }

        return new CanonicalObject
        {
            ObjectId = TopologyHintStableObjectIds.FromHintName(canonicalHint),
            ObjectType = "TopologyResource",
            Name = ContextIngestionStableLineNames.BuildDisplayName(canonicalHint),
            SourceType = "Document",
            SourceId = documentId,
            Properties = properties
        };
    }
}
