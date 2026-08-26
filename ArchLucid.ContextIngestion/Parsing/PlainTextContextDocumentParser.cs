using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Topology;

using static ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes;

namespace ArchLucid.ContextIngestion.Parsing;

public class PlainTextContextDocumentParser : IContextDocumentParser
{
    public bool CanParse(string contentType)
    {
        return IsSupported(contentType);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        ContextDocumentReference document,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(document);
        _ = ct;
        List<CanonicalObject> results = [];

        string content = document.Content;

        if (content.Length > 0 && content[0] == '\uFEFF')
            content = content[1..];

        string[] lines = content
            .Replace("\r\n", "\n")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string line in lines)

            if (line.StartsWith("REQ:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                string canonicalText = CanonicalizeLineText(text, "Requirement");

                results.Add(new CanonicalObject
                {
                    ObjectId = ContextIngestionStableLineNames.StableObjectId("Requirement", canonicalText),
                    ObjectType = "Requirement",
                    Name = ContextIngestionStableLineNames.BuildDisplayName(canonicalText),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = canonicalText }
                });
            }
            else if (line.StartsWith("POL:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                string canonicalText = CanonicalizeLineText(text, "PolicyControl");

                results.Add(new CanonicalObject
                {
                    ObjectId = ContextIngestionStableLineNames.StableObjectId("PolicyControl", canonicalText),
                    ObjectType = "PolicyControl",
                    Name = ContextIngestionStableLineNames.BuildDisplayName(canonicalText),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = canonicalText }
                });
            }
            else if (line.StartsWith("TOP:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                string canonicalText = CanonicalizeLineText(text, "TopologyResource");

                results.Add(PlainTextDocumentTopologyResourceBuilder.Create(document.DocumentId, canonicalText));
            }
            else if (line.StartsWith("SEC:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                string canonicalText = CanonicalizeLineText(text, "SecurityBaseline");

                results.Add(new CanonicalObject
                {
                    ObjectId = ContextIngestionStableLineNames.StableObjectId("SecurityBaseline", canonicalText),
                    ObjectType = "SecurityBaseline",
                    Name = ContextIngestionStableLineNames.BuildDisplayName(canonicalText),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = canonicalText, ["status"] = "declared" }
                });
            }


        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static string CanonicalizeLineText(string text, string objectType)
    {
        if (string.Equals(objectType, "TopologyResource", StringComparison.Ordinal))
            return TopologyHintStableObjectIds.CanonicalizeHintName(text).ToLowerInvariant();

        return text.ToLowerInvariant();
    }
}
