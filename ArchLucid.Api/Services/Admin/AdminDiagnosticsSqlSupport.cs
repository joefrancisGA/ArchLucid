using System.Data.Common;
using System.Globalization;

namespace ArchLucid.Api.Services.Admin;

internal static class AdminDiagnosticsSqlSupport
{
    internal static void AddMaxRowsParameter(DbCommand command, int maxRows)
    {
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);
    }

    internal static void AddMinAgeParameter(DbCommand command, int minAgeMinutes)
    {
        DbParameter minAgeParameter = command.CreateParameter();
        minAgeParameter.ParameterName = "@MinAgeMinutes";
        minAgeParameter.Value = minAgeMinutes;
        command.Parameters.Add(minAgeParameter);
    }

    internal static async Task<long> ExecuteCountAsync(
        DbConnection connection,
        string sql,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? scalar = await command.ExecuteScalarAsync(cancellationToken);

        return scalar is long value
            ? value
            : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);
    }

    internal static async Task<long> ExecuteCountWithMinAgeAsync(
        DbConnection connection,
        string sql,
        int minAgeMinutes,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        AddMinAgeParameter(command, minAgeMinutes);
        object? scalar = await command.ExecuteScalarAsync(cancellationToken);

        return scalar is long value
            ? value
            : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);
    }
}
