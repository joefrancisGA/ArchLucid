using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>Parses Premium-tier insight-generator JSON completions (DX-10).</summary>
public static class InsightGeneratorFindingParser
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static IReadOnlyList<InsightGeneratorProposal> TryParse(string rawJson, int maxFindings)
    {
        if (string.IsNullOrWhiteSpace(rawJson) || maxFindings <= 0)
        {
            return [];
        }

        try
        {
            ParsedShape? parsed = JsonSerializer.Deserialize<ParsedShape>(rawJson, JsonRead);

            if (parsed?.Findings is null || parsed.Findings.Count == 0)
            {
                return [];
            }

            List<InsightGeneratorProposal> proposals = [];

            foreach (ParsedFindingShape row in parsed.Findings)
            {
                if (proposals.Count >= maxFindings)
                {
                    break;
                }

                if (string.IsNullOrWhiteSpace(row.Title) || string.IsNullOrWhiteSpace(row.Rationale))
                {
                    continue;
                }

                IReadOnlyList<string> evidenceRefs = row.EvidenceRefs?
                    .Where(static reference => !string.IsNullOrWhiteSpace(reference))
                    .Select(static reference => reference.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList() ?? [];

                if (evidenceRefs.Count == 0)
                {
                    continue;
                }

                proposals.Add(new InsightGeneratorProposal(
                    row.Title.Trim(),
                    row.Rationale.Trim(),
                    ParseSeverity(row.Severity),
                    string.IsNullOrWhiteSpace(row.Category) ? "Security" : row.Category.Trim(),
                    evidenceRefs));
            }

            return proposals;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static FindingSeverity ParseSeverity(string? severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
        {
            return FindingSeverity.Warning;
        }

        return severity.Trim() switch
        {
            "Info" => FindingSeverity.Info,
            "Error" => FindingSeverity.Error,
            "Critical" => FindingSeverity.Critical,
            _ => FindingSeverity.Warning,
        };
    }

    private sealed class ParsedShape
    {
        [JsonPropertyName("findings")]
        public List<ParsedFindingShape>? Findings
        {
            get;
            set;
        }
    }

    private sealed class ParsedFindingShape
    {
        [JsonPropertyName("title")]
        public string? Title
        {
            get;
            set;
        }

        [JsonPropertyName("rationale")]
        public string? Rationale
        {
            get;
            set;
        }

        [JsonPropertyName("severity")]
        public string? Severity
        {
            get;
            set;
        }

        [JsonPropertyName("category")]
        public string? Category
        {
            get;
            set;
        }

        [JsonPropertyName("evidenceRefs")]
        public List<string>? EvidenceRefs
        {
            get;
            set;
        }
    }
}
