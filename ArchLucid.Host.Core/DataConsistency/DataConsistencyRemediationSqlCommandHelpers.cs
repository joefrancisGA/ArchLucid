using System.Data.Common;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>Shared ADO parameter helpers for data-consistency remediation SQL.</summary>
internal static class DataConsistencyRemediationSqlCommandHelpers
{
    internal static void AddMaxRowsParameter(DbCommand command, int maxRows)
    {
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);
    }
}
