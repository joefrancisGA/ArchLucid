using System.Data;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Connections;
using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Security;

/// <summary>Durable, tenant-scoped replay protection. Missing SQL schema or
/// unavailable persistence must never fall back to process-local watermarks.</summary>
internal sealed class SqlRuntimeAttestationReplayGuard(
    ISqlConnectionFactory? connections) : IRuntimeAttestationReplayGuard
{
    public async Task<bool> TryAcceptAsync(RuntimeObservationRequest scope,
        DateTimeOffset issuedAt, DateTimeOffset enumeratedAt, DateTimeOffset expiresAt,
        string digest, DateTimeOffset now, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (connections is null || scope.TenantId == Guid.Empty ||
            scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(scope.ResourceId) ||
            string.IsNullOrWhiteSpace(scope.DeploymentGeneration) ||
            string.IsNullOrWhiteSpace(scope.RuntimeFamily) ||
            issuedAt > now || enumeratedAt > issuedAt || expiresAt <= now ||
            expiresAt <= issuedAt || expiresAt - issuedAt > TimeSpan.FromMinutes(15) ||
            digest is not { Length: 64 } || !digest.All(Uri.IsHexDigit))
            return false;

        try
        {
            await using var connection = await connections.CreateOpenConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = "dbo.TryAdvanceRuntimeAttestationWatermark";
            command.CommandTimeout = 15;
            command.Parameters.Add("@tenant", SqlDbType.UniqueIdentifier).Value = scope.TenantId;
            command.Parameters.Add("@workspace", SqlDbType.UniqueIdentifier).Value = scope.WorkspaceId;
            command.Parameters.Add("@project", SqlDbType.UniqueIdentifier).Value = scope.ProjectId;
            command.Parameters.Add("@scopeHash", SqlDbType.Binary, 32).Value =
                Convert.FromHexString(RuntimeTelemetryProvisioning.ScopeKey(scope));
            command.Parameters.Add("@issued", SqlDbType.DateTimeOffset).Value = issuedAt;
            command.Parameters.Add("@enumerated", SqlDbType.DateTimeOffset).Value = enumeratedAt;
            command.Parameters.Add("@expires", SqlDbType.DateTimeOffset).Value = expiresAt;
            command.Parameters.Add("@digest", SqlDbType.Binary, 32).Value = Convert.FromHexString(digest);
            object? result = await command.ExecuteScalarAsync(cancellationToken);
            cancellationToken.ThrowIfCancellationRequested();
            return result is bool accepted && accepted;
        }
        catch (Exception exception) when (exception is SqlException or InvalidOperationException
            or TimeoutException or UnauthorizedAccessException)
        {
            return false;
        }
    }
}
