using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationPatternRepository
{
    public async Task<bool> TryApproveVersionAsync(
        RemediationPatternVersionRecord approvedVersion,
        RemediationPatternStatus expectedStatus,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(approvedVersion);

        const string versionSql = """
                                  UPDATE dbo.RemediationPatternVersions
                                  SET Status = @Status,
                                      ApprovedByActorKey = @ApprovedByActorKey,
                                      ApprovedUtc = @ApprovedUtc,
                                      UpdatedUtc = @UpdatedUtc
                                  WHERE TenantId = @TenantId AND PatternId = @PatternId AND VersionId = @VersionId
                                    AND Status = @ExpectedStatus;
                                  """;
        const string patternSql = """
                                  UPDATE dbo.RemediationPatterns
                                  SET CurrentApprovedVersion = @CurrentApprovedVersion, UpdatedUtc = @UpdatedUtc
                                  WHERE TenantId = @TenantId AND PatternId = @PatternId;
                                  """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        int versionsUpdated = await conn.ExecuteAsync(
            new CommandDefinition(versionSql, new
            {
                approvedVersion.TenantId,
                approvedVersion.PatternId,
                approvedVersion.VersionId,
                Status = (int)approvedVersion.Status,
                ExpectedStatus = (int)expectedStatus,
                approvedVersion.ApprovedByActorKey,
                approvedVersion.ApprovedUtc,
                approvedVersion.UpdatedUtc,
            }, transaction: tx, cancellationToken: cancellationToken));

        if (versionsUpdated != 1)
            return false;

        int patternsUpdated = await conn.ExecuteAsync(
            new CommandDefinition(patternSql, new
            {
                approvedVersion.TenantId,
                approvedVersion.PatternId,
                CurrentApprovedVersion = approvedVersion.Version,
                approvedVersion.UpdatedUtc,
            }, transaction: tx, cancellationToken: cancellationToken));

        if (patternsUpdated != 1)
            return false;

        tx.Commit();
        return true;
    }
}
