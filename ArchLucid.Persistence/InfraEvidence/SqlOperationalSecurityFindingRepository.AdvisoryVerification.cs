using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task<bool> TryCloseVerifiedAdvisoryInScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityFindingRecord observedFinding,
        Guid instanceId,
        Guid verificationSnapshotId,
        DateTime snapshotCapturedUtc,
        DateTime verifiedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE f SET Status = @ClosedStatus, UpdatedUtc = @VerifiedUtc
                           FROM dbo.OperationalSecurityFindings f
                           WHERE f.TenantId = @TenantId AND f.WorkspaceId = @WorkspaceId AND f.ProjectId = @ProjectId
                             AND f.FindingId = @FindingId AND f.CloudResourceId = @CloudResourceId
                             AND f.PayloadHashSha256 = @PayloadHashSha256
                             AND f.LastObservedUtc < @SnapshotCapturedUtc AND f.UpdatedUtc <= @VerifiedUtc
                             AND f.Status IN (@OpenStatus, @RecurredStatus)
                             AND EXISTS (
                                 SELECT 1 FROM dbo.RemediationInstances i
                                 WHERE i.TenantId = f.TenantId AND i.WorkspaceId = f.WorkspaceId AND i.ProjectId = f.ProjectId
                                   AND i.FindingId = f.FindingId AND i.CloudResourceId = f.CloudResourceId
                                   AND i.InstanceId = @InstanceId AND i.VerificationSnapshotId = @VerificationSnapshotId
                                   AND i.Status = @VerifiedStatus
                                   AND JSON_VALUE(
                                       CASE WHEN ISJSON(i.VerificationResultJson) = 1 THEN i.VerificationResultJson ELSE '{}' END,
                                       '$.advisoryFindingPayloadHash') = @PayloadHashHex
                             );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int affected = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            observedFinding.FindingId,
            observedFinding.CloudResourceId,
            observedFinding.PayloadHashSha256,
            PayloadHashHex = Convert.ToHexString(observedFinding.PayloadHashSha256),
            InstanceId = instanceId,
            VerificationSnapshotId = verificationSnapshotId,
            SnapshotCapturedUtc = snapshotCapturedUtc,
            VerifiedUtc = verifiedUtc,
            ClosedStatus = (int)OperationalSecurityFindingStatus.Closed,
            OpenStatus = (int)OperationalSecurityFindingStatus.Open,
            RecurredStatus = (int)OperationalSecurityFindingStatus.Recurred,
            VerifiedStatus = (int)RemediationInstanceStatus.Verified,
        }, cancellationToken: cancellationToken));
        return affected == 1;
    }
}
