using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

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
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

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
        string json = JsonSerializer.Serialize(profile, JsonOptions);

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
                    ProfileJson = json
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
            take: 1,
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
        int boundedTake = Math.Clamp(take, 1, 100);

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
            take: null,
            ct).ConfigureAwait(false);

        return row is null ? null : ToRecord(row);
    }

    private async Task<ProfileRow?> QuerySingleProfileRowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? profileId,
        int? take,
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
                    Take = take,
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }

    private RecommendationLearningProfileRecord ToRecord(ProfileRow row)
    {
        RecommendationLearningProfile? profile;
        try
        {
            profile = JsonSerializer.Deserialize<RecommendationLearningProfile>(row.ProfileJson, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"RecommendationLearningProfile JSON for profile={row.ProfileId} is corrupt.",
                ex);
        }

        if (profile is null)
        {
            throw new InvalidOperationException($"RecommendationLearningProfile JSON for profile={row.ProfileId} was empty.");
        }

        return new RecommendationLearningProfileRecord
        {
            ProfileId = row.ProfileId,
            Profile = NormalizeDictionaryComparers(profile),
        };
    }

    private static RecommendationLearningProfile NormalizeDictionaryComparers(RecommendationLearningProfile profile)
    {
        profile.CategoryWeights = new Dictionary<string, double>(profile.CategoryWeights, StringComparer.OrdinalIgnoreCase);
        profile.UrgencyWeights = new Dictionary<string, double>(profile.UrgencyWeights, StringComparer.OrdinalIgnoreCase);
        profile.SignalTypeWeights = new Dictionary<string, double>(profile.SignalTypeWeights, StringComparer.OrdinalIgnoreCase);
        return profile;
    }

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
