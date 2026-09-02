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

            if (TryGetPrefixedBody(line, "REQ", out string requirementText))
            {
                if (string.IsNullOrWhiteSpace(requirementText))
                    continue;

                string canonicalText = CanonicalizeLineText(requirementText, "Requirement");

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
            else if (TryGetPrefixedBody(line, "POL", out string policyText))
            {
                if (string.IsNullOrWhiteSpace(policyText))
                    continue;

                string canonicalText = CanonicalizeLineText(policyText, "PolicyControl");

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
            else if (TryGetPrefixedBody(line, "TOP", out string topologyText))
            {
                if (string.IsNullOrWhiteSpace(topologyText))
                    continue;

                string canonicalText = CanonicalizeLineText(topologyText, "TopologyResource");

                results.Add(PlainTextDocumentTopologyResourceBuilder.Create(document.DocumentId, canonicalText));
            }
            else if (TryGetPrefixedBody(line, "SEC", out string securityText))
            {
                if (string.IsNullOrWhiteSpace(securityText))
                    continue;

                string canonicalText = CanonicalizeLineText(securityText, "SecurityBaseline");

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

    private static bool TryGetPrefixedBody(string line, string prefix, out string body)
    {
        body = string.Empty;

        if (line.Length < prefix.Length)
            return false;

        if (!line.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        int index = prefix.Length;

        while (index < line.Length && char.IsWhiteSpace(line[index]))
            index++;

        if (index >= line.Length || line[index] != ':')
            return false;

        index++;
        body = line[index..].Trim();

        return true;
    }

    private static string CanonicalizeLineText(string text, string objectType)
    {
        return TopologyHintStableObjectIds.CanonicalizeHintName(text).ToLowerInvariant();
    }
}
