using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>Parses Premium-tier insight-density judge JSON completions.</summary>
public static class InsightDensityLlmJudgmentParser
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static InsightDensityLlmJudgment? TryParse(string rawJson, string expectedFindingId)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return null;
        }

        try
        {
            ParsedShape? parsed = JsonSerializer.Deserialize<ParsedShape>(rawJson, JsonRead);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.FindingId))
            {
                return null;
            }

            if (!string.Equals(parsed.FindingId.Trim(), expectedFindingId, StringComparison.Ordinal))
            {
                return null;
            }

            return new InsightDensityLlmJudgment
            {
                FindingId = parsed.FindingId.Trim(),
                InsightDensityScore = Math.Clamp(parsed.InsightDensityScore, 0, 100),
                WhyThisIsNotGeneric = TrimToNull(parsed.WhyThisIsNotGeneric),
                PrincipalArchitectValue = TrimToNull(parsed.PrincipalArchitectValue),
                DecisionConsequence = TrimToNull(parsed.DecisionConsequence),
                DemoteToChecklist = parsed.DemoteToChecklist,
                EvidenceRefs = parsed.EvidenceRefs?
                    .Where(static reference => !string.IsNullOrWhiteSpace(reference))
                    .Select(static reference => reference.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList() ?? [],
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private sealed class ParsedShape
    {
        [JsonPropertyName("findingId")]
        public string? FindingId
        {
            get;
            set;
        }

        [JsonPropertyName("insightDensityScore")]
        public int InsightDensityScore
        {
            get;
            set;
        }

        [JsonPropertyName("whyThisIsNotGeneric")]
        public string? WhyThisIsNotGeneric
        {
            get;
            set;
        }

        [JsonPropertyName("principalArchitectValue")]
        public string? PrincipalArchitectValue
        {
            get;
            set;
        }

        [JsonPropertyName("decisionConsequence")]
        public string? DecisionConsequence
        {
            get;
            set;
        }

        [JsonPropertyName("demoteToChecklist")]
        public bool DemoteToChecklist
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
