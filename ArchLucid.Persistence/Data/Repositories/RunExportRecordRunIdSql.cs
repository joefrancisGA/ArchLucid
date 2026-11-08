namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Run export rows store <see cref="ArchLucid.Contracts.Metadata.RunExportRecord.RunId" /> as NVARCHAR; demo seeds
///     use RFC <c>N</c> (32-char hex) while API clients often pass hyphenated <c>D</c> route ids.
/// </summary>
internal static class RunExportRecordRunIdSql
{
    internal static IReadOnlyList<string> LookupKeys(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();

        if (!Guid.TryParse(trimmed, out Guid runGuid))
            return [trimmed];

        string canonical = runGuid.ToString("N");
        string dashed = runGuid.ToString("D");

        if (string.Equals(trimmed, canonical, StringComparison.OrdinalIgnoreCase))
            return [canonical];

        if (string.Equals(trimmed, dashed, StringComparison.OrdinalIgnoreCase))
            return [canonical, dashed];

        return [trimmed, canonical, dashed];
    }

    /// <summary>
    ///     Canonicalize stored/exported run id strings to lowercase <c>N</c> when parseable as a GUID.
    /// </summary>
    internal static string NormalizeRunIdForRead(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();
        return Guid.TryParse(trimmed, out Guid runGuid) ? runGuid.ToString("N") : trimmed;
    }
}
