using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Sets <c>SESSION_CONTEXT</c> so integration tests can read/write <c>dbo.Runs</c> and authority-chain tables when
///     <c>rls.ArchLucidTenantScope</c> is enabled. Matches keys used by <c>rls.archlucid_scope_predicate</c>.
/// </summary>
internal static class PersistenceIntegrationTestRlsSession
{
    private static readonly string[] SessionKeys = ["al_rls_bypass", "al_tenant_id", "al_workspace_id", "al_project_id"];

    /// <summary>
    ///     Clears scope keys and sets <c>al_rls_bypass</c> so the connection is not filtered by tenant predicates.
    /// </summary>
    internal static async Task ApplyArchLucidRlsBypassAsync(SqlConnection connection, CancellationToken ct)
    {
        foreach (string key in SessionKeys)
        {
            await using SqlCommand cmd = connection.CreateCommand();
            cmd.CommandText = "EXEC sp_set_session_context @k, NULL, @read_only;";
            cmd.Parameters.AddWithValue("@k", key);
            cmd.Parameters.AddWithValue("@read_only", 0);
            await cmd.ExecuteNonQueryAsync(ct);
        }

        await using SqlCommand bypass = connection.CreateCommand();
        bypass.CommandText = "EXEC sp_set_session_context @k, @v, @read_only;";
        bypass.Parameters.AddWithValue("@k", "al_rls_bypass");
        bypass.Parameters.AddWithValue("@v", 1);
        bypass.Parameters.AddWithValue("@read_only", 0);
        await bypass.ExecuteNonQueryAsync(ct);
    }
}
