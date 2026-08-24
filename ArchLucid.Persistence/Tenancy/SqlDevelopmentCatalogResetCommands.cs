using System.Data;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Deploys and invokes <c>dbo.usp_ArchLucid_ResetDevelopmentCatalog</c> in <c>master</c>
///     (drop + recreate an empty development catalog).
/// </summary>
public static class SqlDevelopmentCatalogResetCommands
{
    public const string ProcedureName = "usp_ArchLucid_ResetDevelopmentCatalog";
    public const string ConfirmToken = "RESET";

    public static async Task EnsureProcedureAsync(string applicationConnectionString, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(applicationConnectionString);

        string scriptPath = PersistenceScriptPaths.ResolveMasterScriptPath();
        string masterConnectionString = SqlConnectionStringMasterCatalog.RedirectToMaster(applicationConnectionString);
        SqlConnectionFactory connectionFactory = new(masterConnectionString);
        SqlSchemaBootstrapper bootstrapper = new(
            connectionFactory,
            scriptPath,
            SqlCommandTimeouts.ExtendedSeconds);

        await bootstrapper.EnsureSchemaAsync(cancellationToken).ConfigureAwait(false);
    }

    public static async Task ExecuteResetAsync(string applicationConnectionString, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(applicationConnectionString);

        string catalogName = SqlConnectionStringMasterCatalog.ReadInitialCatalog(applicationConnectionString);
        string masterConnectionString = SqlConnectionStringMasterCatalog.RedirectToMaster(applicationConnectionString);

        await using SqlConnection connection = new(masterConnectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using SqlCommand command = new(
            "EXEC dbo.usp_ArchLucid_ResetDevelopmentCatalog @DatabaseName = @name, @Confirm = @confirm;",
            connection);
        command.CommandTimeout = SqlCommandTimeouts.ExtendedSeconds;

        SqlParameter nameParameter = command.Parameters.Add("@name", SqlDbType.NVarChar, 128);
        nameParameter.Value = catalogName;

        SqlParameter confirmParameter = command.Parameters.Add("@confirm", SqlDbType.NVarChar, 32);
        confirmParameter.Value = ConfirmToken;

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }
}
