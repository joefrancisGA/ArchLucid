using ArchLucid.Persistence.Archival;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class DataArchivalRules
{
    public static void Collect(IConfiguration configuration, List<string> errors)
    {
        DataArchivalOptions opts =
            configuration.GetSection(DataArchivalOptions.SectionName).Get<DataArchivalOptions>() ??
            new DataArchivalOptions();

        const int maxDays = 3650;

        if (opts.RunsRetentionDays is < 0 or > maxDays)

            errors.Add($"DataArchival:RunsRetentionDays must be between 0 and {maxDays} (0 disables run archival).");

        if (opts.DigestsRetentionDays is < 0 or > maxDays)

            errors.Add($"DataArchival:DigestsRetentionDays must be between 0 and {maxDays} (0 disables digest archival).");

        if (opts.ConversationsRetentionDays is < 0 or > maxDays)

            errors.Add(
                $"DataArchival:ConversationsRetentionDays must be between 0 and {maxDays} (0 disables thread archival).");

        if (opts.PurgeArchivedAgentExecutionTracesAfterDays is < 0 or > maxDays)

            errors.Add(
                $"DataArchival:PurgeArchivedAgentExecutionTracesAfterDays must be between 0 and {maxDays} (0 disables trace hard-delete).");

        if (opts.PurgeArchivedAgentExecutionTracesAfterDays > 0 &&
            opts.PurgeArchivedAgentExecutionTracesBatchSize is < 1 or > 10_000)

            errors.Add(
                "DataArchival:PurgeArchivedAgentExecutionTracesBatchSize must be between 1 and 10000 when trace purge is enabled.");

        if (opts.IntervalHours is < 1 or > 168)

            errors.Add("DataArchival:IntervalHours must be between 1 and 168.");
    }
}
