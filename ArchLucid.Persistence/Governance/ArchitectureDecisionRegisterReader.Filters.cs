using System.Text;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

using Dapper;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureDecisionRegisterReader
{
    private static string AppendFilterParameters(
        ArchitectureDecisionRegisterQueryOptions? filters,
        DynamicParameters parameters)
    {
        if (filters is null)
            return string.Empty;

        StringBuilder sql = new();

        if (!string.IsNullOrWhiteSpace(filters.Category))
        {
            sql.Append(" AND LOWER(LTRIM(RTRIM(d.Category))) = LOWER(LTRIM(RTRIM(@Category)))");
            parameters.Add("Category", filters.Category.Trim());
        }

        if (filters.RecordedAfterUtc is not null)
        {
            sql.Append(" AND m.CreatedUtc >= @RecordedAfterUtc");
            parameters.Add("RecordedAfterUtc", filters.RecordedAfterUtc.Value.UtcDateTime);
        }

        if (filters.RecordedBeforeUtc is not null)
        {
            sql.Append(" AND m.CreatedUtc <= @RecordedBeforeUtc");
            parameters.Add("RecordedBeforeUtc", filters.RecordedBeforeUtc.Value.UtcDateTime);
        }

        if (filters.MinConfidence is not null)
        {
            sql.Append(" AND d.Confidence IS NOT NULL AND d.Confidence >= @MinConfidence");
            parameters.Add("MinConfidence", filters.MinConfidence);
        }

        if (filters.MaxConfidence is not null)
        {
            sql.Append(" AND d.Confidence IS NOT NULL AND d.Confidence <= @MaxConfidence");
            parameters.Add("MaxConfidence", filters.MaxConfidence);
        }

        if (!string.IsNullOrWhiteSpace(filters.BuyerConfidenceSource))
        {
            IReadOnlyList<string> confidenceSources =
                ResolveConfidenceSourceNamesForBuyerLabel(filters.BuyerConfidenceSource.Trim());

            sql.Append(" AND d.ConfidenceSource IN @ConfidenceSources");
            parameters.Add("ConfidenceSources", confidenceSources);
        }

        return sql.ToString();
    }

    private static IReadOnlyList<string> ResolveConfidenceSourceNamesForBuyerLabel(string buyerLabel)
    {
        if (string.Equals(buyerLabel, BuyerDecisionConfidenceSource.EvidenceBacked, StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                nameof(DecisionConfidenceSource.FindingEvaluation),
                nameof(DecisionConfidenceSource.FindingAggregate),
                nameof(DecisionConfidenceSource.RuleEngine),
                nameof(DecisionConfidenceSource.Calibrated),
            ];
        }

        if (string.Equals(buyerLabel, BuyerDecisionConfidenceSource.ModelAssisted, StringComparison.OrdinalIgnoreCase))
            return [nameof(DecisionConfidenceSource.LlmAgent)];

        return
        [
            nameof(DecisionConfidenceSource.Unknown),
            nameof(DecisionConfidenceSource.NotComputed),
        ];
    }
}
