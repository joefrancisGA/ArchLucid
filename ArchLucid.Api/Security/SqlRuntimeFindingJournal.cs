using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Connections;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

// Append-only evidence journal. Never modifies a sealed findings snapshot.
internal sealed class SqlRuntimeFindingJournal(ISqlConnectionFactory? connections,
    IConfiguration config, IRuntimeAttestationPublicationAuthority authority) : IRuntimeFindingJournal
{
    public async Task<bool> AppendAsync(RuntimeObservationRequest request, RuntimeCatalogAssessment assessment,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (connections is null || !RuntimeTelemetryProvisioning.Enabled(config) ||
            !assessment.CatalogCurrent || request.TenantId == Guid.Empty ||
            request.WorkspaceId == Guid.Empty || request.ProjectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
            string.IsNullOrWhiteSpace(request.RuntimeFamily) ||
            assessment.Findings is null || assessment.LifecycleFindings is null ||
            assessment.Findings.Count + assessment.LifecycleFindings.Count is <= 0 or > 2000 ||
            assessment.Findings.Any(f => f is null || f.Scope != request ||
                string.IsNullOrWhiteSpace(f.AdvisoryId) || string.IsNullOrWhiteSpace(f.AdvisoryEvidenceId) ||
                string.IsNullOrWhiteSpace(f.CatalogEvidenceId) || string.IsNullOrWhiteSpace(f.RuntimeEvidenceReference)) ||
            assessment.LifecycleFindings.Any(f => f is null || f.Scope != request ||
                string.IsNullOrWhiteSpace(f.InstanceId) || string.IsNullOrWhiteSpace(f.ReleaseLine) ||
                string.IsNullOrWhiteSpace(f.LifecycleEvidenceId) || string.IsNullOrWhiteSpace(f.CatalogEvidenceId) ||
                string.IsNullOrWhiteSpace(f.RuntimeEvidenceReference)) ||
            !await authority.CanPublishAsync(request, ct)) return false;
        try
        {
            var payload = JsonSerializer.SerializeToUtf8Bytes(assessment);
            if (payload.Length > 1048576) return false;
            await using var connection = await connections.CreateOpenConnectionAsync(ct);
            await using var command = connection.CreateCommand();
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = "dbo.AppendRuntimeFindingEvidence";
            command.CommandTimeout = 15;
            command.Parameters.Add("@tenant", SqlDbType.UniqueIdentifier).Value = request.TenantId;
            command.Parameters.Add("@workspace", SqlDbType.UniqueIdentifier).Value = request.WorkspaceId;
            command.Parameters.Add("@project", SqlDbType.UniqueIdentifier).Value = request.ProjectId;
            command.Parameters.Add("@scopeHash", SqlDbType.Binary, 32).Value =
                Convert.FromHexString(RuntimeTelemetryProvisioning.ScopeKey(request));
            command.Parameters.Add("@payloadHash", SqlDbType.Binary, 32).Value = SHA256.HashData(payload);
            command.Parameters.Add("@payload", SqlDbType.VarBinary, -1).Value = payload;
            if (!await authority.CanPublishAsync(request, ct)) return false;
            return await command.ExecuteScalarAsync(ct) is bool accepted && accepted;
        }
        catch (Exception ex) when (ex is SqlException or InvalidOperationException or TimeoutException or UnauthorizedAccessException)
        { return false; }
    }
}
