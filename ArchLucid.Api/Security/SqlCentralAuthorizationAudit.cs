using ArchLucid.Persistence.Connections;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Security;

/// <summary>
/// Synchronously commits authorization decisions to SQL before an allow is returned.
/// SQL errors propagate to the central fail-closed authorization service.
/// </summary>
public sealed class SqlCentralAuthorizationAudit(ISqlConnectionFactory connections)
    : ICentralAuthorizationAudit
{
    public async Task WriteAsync(
        CentralAuthorizationAuditRecord record, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await connections
            .CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        await using SqlCommand command = connection.CreateCommand();
        // Stored procedure atomically commits the journal row and chained digest.
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.CommandText = "dbo.AppendAuthorizationDecision";
        command.CommandTimeout = 10;
        command.Parameters.Add("@decision", System.Data.SqlDbType.UniqueIdentifier).Value = record.DecisionId;
        command.Parameters.Add("@tenant", System.Data.SqlDbType.UniqueIdentifier).Value = record.TenantId;
        command.Parameters.Add("@workspace", System.Data.SqlDbType.UniqueIdentifier).Value = record.WorkspaceId;
        command.Parameters.Add("@project", System.Data.SqlDbType.UniqueIdentifier).Value = record.ProjectId;
        command.Parameters.Add("@resource", System.Data.SqlDbType.UniqueIdentifier).Value = record.ResourceId;
        command.Parameters.Add("@action", System.Data.SqlDbType.NVarChar, 128).Value = record.Action;
        command.Parameters.Add("@allowed", System.Data.SqlDbType.Bit).Value = record.Allowed;
        command.Parameters.Add("@reason", System.Data.SqlDbType.NVarChar, 128).Value = record.Reason;
        command.Parameters.Add("@caller", System.Data.SqlDbType.NVarChar, 64).Value = record.CallerKind;
        command.Parameters.Add("@occurred", System.Data.SqlDbType.DateTimeOffset).Value = record.OccurredUtc;
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }
}

/// <summary>No persistence configured: reject all decisions rather than log-only success.</summary>
public sealed class UnavailableCentralAuthorizationAudit : ICentralAuthorizationAudit
{
    public Task WriteAsync(CentralAuthorizationAuditRecord record, CancellationToken cancellationToken) =>
        Task.FromException(new InvalidOperationException("Durable authorization audit unavailable."));
}
