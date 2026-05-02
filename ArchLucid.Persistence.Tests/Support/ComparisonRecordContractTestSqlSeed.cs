using ArchLucid.Contracts.Metadata;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Ensures <c>dbo.Runs</c> rows exist for comparison contract tests after TB-006 FK on
///     <c>dbo.ComparisonRecords.LeftRunId</c>/<c>RightRunId</c>.
/// </summary>
public static class ComparisonRecordContractTestSqlSeed
{
    public static async Task EnsureRunsForComparisonRecordAsync(
        SqlConnection connection,
        ComparisonRecord row,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(row.LeftRunId) && Guid.TryParse(row.LeftRunId, out _))
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
                connection,
                "cmp-l-" + row.ComparisonRecordId,
                row.LeftRunId,
                ct);

        if (!string.IsNullOrWhiteSpace(row.RightRunId) && Guid.TryParse(row.RightRunId, out _))
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
                connection,
                "cmp-r-" + row.ComparisonRecordId,
                row.RightRunId,
                ct);
    }
}
