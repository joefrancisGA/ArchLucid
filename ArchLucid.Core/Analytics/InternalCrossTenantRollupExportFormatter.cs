using System.Globalization;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Core.Analytics;

/// <summary>CSV/JSON export for operator rollups (surrogate keys only).</summary>
public static class InternalCrossTenantRollupExportFormatter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    public static string ToCsv(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows)
    {
        StringBuilder builder = new();
        builder.AppendLine(
            "rollup_date,analytics_tenant_key,total_runs_non_archived,total_completed_runs,average_completed_run_duration_seconds,estimated_engineering_hours_saved,llm_tokens_used,computed_utc");

        foreach (InternalCrossTenantRollupDailyRow row in rows)
        {
            string avg = row.AverageCompletedRunDurationSeconds.HasValue
                ? row.AverageCompletedRunDurationSeconds.Value.ToString(CultureInfo.InvariantCulture)
                : string.Empty;

            string tokens = row.LlmTokensUsed.HasValue
                ? row.LlmTokensUsed.Value.ToString(CultureInfo.InvariantCulture)
                : string.Empty;

            builder.Append(row.RollupDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            builder.Append(',');
            builder.Append(row.AnalyticsTenantKey);
            builder.Append(',');
            builder.Append(row.TotalRunsNonArchived.ToString(CultureInfo.InvariantCulture));
            builder.Append(',');
            builder.Append(row.TotalCompletedRuns.ToString(CultureInfo.InvariantCulture));
            builder.Append(',');
            builder.Append(avg);
            builder.Append(',');
            builder.Append(row.EstimatedEngineeringHoursSaved.ToString(CultureInfo.InvariantCulture));
            builder.Append(',');
            builder.Append(tokens);
            builder.Append(',');
            builder.Append(row.ComputedUtc.UtcDateTime.ToString("O", CultureInfo.InvariantCulture));
            builder.AppendLine();
        }

        return builder.ToString();
    }

    public static string ToJson(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows)
    {
        return JsonSerializer.Serialize(rows, JsonOptions);
    }
}
