using System.Data.Common;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Shared SQL parameter helpers for data-consistency remediation commands.
/// </summary>
internal static class DataConsistencyRemediationSqlHelpers
{
    public static void AddMaxRowsParameter(DbCommand command, int maxRows)
    {
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);
    }
}
