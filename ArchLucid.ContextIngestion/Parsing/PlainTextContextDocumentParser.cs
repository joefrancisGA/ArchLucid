using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Models;

using System.Security.Cryptography;
using System.Text;

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

                results.Add(new CanonicalObject
                {
                    ObjectType = "Requirement",
                    Name = BuildStableLineName(text),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = text }
                });
            }
            else if (line.StartsWith("POL:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                results.Add(new CanonicalObject
                {
                    ObjectType = "PolicyControl",
                    Name = BuildStableLineName(text),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = text }
                });
            }
            else if (line.StartsWith("TOP:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                results.Add(new CanonicalObject
                {
                    ObjectType = "TopologyResource",
                    Name = BuildStableLineName(text),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = text }
                });
            }
            else if (line.StartsWith("SEC:", StringComparison.OrdinalIgnoreCase))
            {
                string text = line[4..].Trim();

                results.Add(new CanonicalObject
                {
                    ObjectType = "SecurityBaseline",
                    Name = BuildStableLineName(text),
                    SourceType = "Document",
                    SourceId = document.DocumentId,
                    Properties = new Dictionary<string, string> { ["text"] = text, ["status"] = "declared" }
                });
            }


        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static string BuildStableLineName(string text)
    {
        if (text.Length <= 80)
            return text;

        string prefix = text[..80];
        string suffix = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)).AsSpan(0, 4)).ToLowerInvariant();

        return $"{prefix}#{suffix}";
    }
}
