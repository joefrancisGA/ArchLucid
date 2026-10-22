using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>Parses Premium-tier prose assumption extraction JSON completions (DX-55).</summary>
public static class ProseAssumptionExtractionParser
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static IReadOnlyList<ProseAssumptionCandidate> TryParse(string rawJson, int maxCandidates)
    {
        if (string.IsNullOrWhiteSpace(rawJson) || maxCandidates <= 0)
        {
            return [];
        }

        try
        {
            ParsedShape? parsed = JsonSerializer.Deserialize<ParsedShape>(rawJson, JsonRead);

            if (parsed?.Assumptions is null || parsed.Assumptions.Count == 0)
            {
                return [];
            }

            List<ProseAssumptionCandidate> candidates = [];

            foreach (ParsedAssumptionShape row in parsed.Assumptions)
            {
                if (candidates.Count >= maxCandidates)
                {
                    break;
                }

                if (string.IsNullOrWhiteSpace(row.Statement)
                    || string.IsNullOrWhiteSpace(row.DocumentPath)
                    || string.IsNullOrWhiteSpace(row.QuotedSpan)
                    || row.LineNumber <= 0
                    || string.IsNullOrWhiteSpace(row.LogicalPropertyName)
                    || string.IsNullOrWhiteSpace(row.ImpliedPropertyValue))
                {
                    continue;
                }

                candidates.Add(new ProseAssumptionCandidate
                {
                    Statement = row.Statement.Trim(),
                    DocumentPath = row.DocumentPath.Trim(),
                    LineNumber = row.LineNumber,
                    QuotedSpan = row.QuotedSpan.Trim(),
                    LogicalPropertyName = row.LogicalPropertyName.Trim(),
                    ImpliedPropertyValue = row.ImpliedPropertyValue.Trim(),
                });
            }

            return candidates;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private sealed class ParsedShape
    {
        [JsonPropertyName("assumptions")]
        public List<ParsedAssumptionShape>? Assumptions
        {
            get;
            set;
        }
    }

    private sealed class ParsedAssumptionShape
    {
        public string? Statement
        {
            get;
            set;
        }

        public string? DocumentPath
        {
            get;
            set;
        }

        public int LineNumber
        {
            get;
            set;
        }

        public string? QuotedSpan
        {
            get;
            set;
        }

        public string? LogicalPropertyName
        {
            get;
            set;
        }

        public string? ImpliedPropertyValue
        {
            get;
            set;
        }
    }
}
