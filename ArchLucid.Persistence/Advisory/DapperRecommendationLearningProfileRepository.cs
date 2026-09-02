using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
/// Dapper implementation of <see cref="IRecommendationLearningProfileRepository"/> backed by <c>dbo.RecommendationLearningProfiles</c>.
/// Profiles are serialized to JSON on write and deserialized on read; dictionary comparers are normalized to <see cref="StringComparer.OrdinalIgnoreCase"/> after deserialization.
/// </summary>
/// <param name="connectionFactory">SQL connection factory (scoped in DI).</param>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperRecommendationLearningProfileRepository(ISqlConnectionFactory connectionFactory)
    : IRecommendationLearningProfileRepository
{
    public async Task SaveAsync(RecommendationLearningProfile profile, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(profile);

        const string sql = """
            INSERT INTO dbo.RecommendationLearningProfiles
            (
                ProfileId,
                TenantId,
                WorkspaceId,
                ProjectId,
                GeneratedUtc,
                ProfileJson
            )
            VALUES
            (
                @ProfileId,
                @TenantId,
                @WorkspaceId,
                @ProjectId,
                @GeneratedUtc,
                @ProfileJson
            );
            """;

        Guid profileId = Guid.NewGuid();
        string json = RecommendationLearningProfileRepositoryCore.SerializeProfile(profile);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ProfileId = profileId,
                    profile.TenantId,
                    profile.WorkspaceId,
                    profile.ProjectId,
                    profile.GeneratedUtc,
                    ProfileJson = json,
                },
                cancellationToken: ct));
    }

    public async Task<RecommendationLearningProfile?> GetLatestAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        RecommendationLearningProfileRecord? record =
            await GetLatestRecordAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        return record?.Profile;
    }

    public async Task<RecommendationLearningProfileRecord?> GetLatestRecordAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ProfileRow? row = await QuerySingleProfileRowAsync(
            tenantId,
            workspaceId,
            projectId,
            profileId: null,
            ct).ConfigureAwait(false);

        return row is null ? null : ToRecord(row);
    }

    public async Task<IReadOnlyList<RecommendationLearningProfileRecord>> ListHistoryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        int boundedTake = RecommendationLearningProfileRepositoryCore.ClampHistoryTake(take);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
            SELECT TOP (@Take)
                ProfileId,
                TenantId,
                WorkspaceId,
                ProjectId,
                GeneratedUtc,
                ProfileJson
            FROM dbo.RecommendationLearningProfiles
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY GeneratedUtc DESC;
            """;

        IEnumerable<ProfileRow> rows = await connection.QueryAsync<ProfileRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Take = boundedTake,
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return rows.Select(ToRecord).ToList();
    }

    public async Task<RecommendationLearningProfileRecord?> GetByProfileIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid profileId,
        CancellationToken ct)
    {
        ProfileRow? row = await QuerySingleProfileRowAsync(
            tenantId,
            workspaceId,
            projectId,
            profileId,
            ct).ConfigureAwait(false);

        return row is null ? null : ToRecord(row);
    }

    private async Task<ProfileRow?> QuerySingleProfileRowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? profileId,
        CancellationToken ct)
    {
        string sql = profileId.HasValue
            ? """
                SELECT
                    ProfileId,
                    TenantId,
                    WorkspaceId,
                    ProjectId,
                    GeneratedUtc,
                    ProfileJson
                FROM dbo.RecommendationLearningProfiles
                WHERE TenantId = @TenantId
                  AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ProjectId
                  AND ProfileId = @ProfileId;
                """
            : """
                SELECT TOP (1)
                    ProfileId,
                    TenantId,
                    WorkspaceId,
                    ProjectId,
                    GeneratedUtc,
                    ProfileJson
                FROM dbo.RecommendationLearningProfiles
                WHERE TenantId = @TenantId
                  AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ProjectId
                ORDER BY GeneratedUtc DESC;
                """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        return await connection.QuerySingleOrDefaultAsync<ProfileRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ProfileId = profileId,
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }

    private static RecommendationLearningProfileRecord ToRecord(ProfileRow row) =>
        RecommendationLearningProfileRepositoryCore.ToRecord(
            row.ProfileId,
            RecommendationLearningProfileRepositoryCore.DeserializeProfile(row.ProfileJson, row.ProfileId));

    private sealed class ProfileRow
    {
        public Guid ProfileId
        {
            get;
            set;
        }

        public Guid TenantId
        {
            get;
            set;
        }

        public Guid WorkspaceId
        {
            get;
            set;
        }

        public Guid ProjectId
        {
            get;
            set;
        }

        public DateTime GeneratedUtc
        {
            get;
            set;
        }

        public string ProfileJson
        {
            get;
            set;
        } = string.Empty;
    }
}
