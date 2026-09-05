using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlRemediationWaveRepository(ISqlConnectionFactory connectionFactory)
    : IRemediationWaveRepository
{
    public async Task InsertWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.RemediationWaves
                               (WaveId, TenantId, WorkspaceId, ProjectId, Name, TargetSize, Status,
                                CreatedByActorKey, CreatedUtc, UpdatedUtc)
                           VALUES
                               (@WaveId, @TenantId, @WorkspaceId, @ProjectId, @Name, @TargetSize, @Status,
                                @CreatedByActorKey, @CreatedUtc, @UpdatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    wave.WaveId,
                    wave.TenantId,
                    wave.WorkspaceId,
                    wave.ProjectId,
                    wave.Name,
                    wave.TargetSize,
                    Status = (int)wave.Status,
                    wave.CreatedByActorKey,
                    wave.CreatedUtc,
                    wave.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpdateWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RemediationWaves
                           SET Name = @Name,
                               TargetSize = @TargetSize,
                               Status = @Status,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId AND WaveId = @WaveId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    wave.WaveId,
                    wave.TenantId,
                    wave.Name,
                    wave.TargetSize,
                    Status = (int)wave.Status,
                    wave.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<RemediationWaveRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT WaveId, TenantId, WorkspaceId, ProjectId, Name, TargetSize, Status,
                                  CreatedByActorKey, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationWaves
                           WHERE TenantId = @TenantId AND WaveId = @WaveId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        WaveRow? row = await conn.QuerySingleOrDefaultAsync<WaveRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WaveId = waveId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapWave(row);
    }

    public async Task<IReadOnlyList<RemediationWaveRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT WaveId, TenantId, WorkspaceId, ProjectId, Name, TargetSize, Status,
                                  CreatedByActorKey, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationWaves
                           WHERE TenantId = @TenantId
                           ORDER BY UpdatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<WaveRow> rows = await conn.QueryAsync<WaveRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(MapWave).ToList();
    }

    public async Task InsertMemberAsync(RemediationWaveMemberRecord member, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.RemediationWaveMembers
                               (MemberId, WaveId, TenantId, FindingId, InstanceId, CloudResourceId,
                                PriorityRank, PriorityScore, CreatedUtc)
                           VALUES
                               (@MemberId, @WaveId, @TenantId, @FindingId, @InstanceId, @CloudResourceId,
                                @PriorityRank, @PriorityScore, @CreatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    member.MemberId,
                    member.WaveId,
                    member.TenantId,
                    member.FindingId,
                    member.InstanceId,
                    member.CloudResourceId,
                    member.PriorityRank,
                    member.PriorityScore,
                    member.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT MemberId, WaveId, TenantId, FindingId, InstanceId, CloudResourceId,
                                  PriorityRank, PriorityScore, CreatedUtc
                           FROM dbo.RemediationWaveMembers
                           WHERE TenantId = @TenantId AND WaveId = @WaveId
                           ORDER BY PriorityRank;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<MemberRow> rows = await conn.QueryAsync<MemberRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WaveId = waveId },
                cancellationToken: cancellationToken));

        return rows.Select(MapMember).ToList();
    }

    private static RemediationWaveRecord MapWave(WaveRow row) =>
        new()
        {
            WaveId = row.WaveId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Name = row.Name,
            TargetSize = row.TargetSize,
            Status = (RemediationWaveStatus)row.Status,
            CreatedByActorKey = row.CreatedByActorKey,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private static RemediationWaveMemberRecord MapMember(MemberRow row) =>
        new()
        {
            MemberId = row.MemberId,
            WaveId = row.WaveId,
            TenantId = row.TenantId,
            FindingId = row.FindingId,
            InstanceId = row.InstanceId,
            CloudResourceId = row.CloudResourceId,
            PriorityRank = row.PriorityRank,
            PriorityScore = row.PriorityScore,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class WaveRow
    {
        public Guid WaveId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public int? TargetSize
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public string CreatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }

    private sealed class MemberRow
    {
        public Guid MemberId
        {
            get;
            init;
        }

        public Guid WaveId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public Guid? InstanceId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public int PriorityRank
        {
            get;
            init;
        }

        public decimal PriorityScore
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
