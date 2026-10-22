using ArchLucid.Contracts.User;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="DapperUserSettingsRepository" /> against real SQL Server + production-shaped DDL from DbUp.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperUserSettingsRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task UpsertAsync_round_trips_working_workspace_continuity_payload_wider_than_legacy_512_chars()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperUserSettingsRepository repository = new(factory);

        WorkingWorkspaceContinuityDto continuity = BuildContinuityPayloadThatExceedsLegacyColumnWidth();
        string serialized = WorkingWorkspaceContinuityValues.Serialize(continuity);

        serialized.Length.Should().BeGreaterThan(512);

        string userId = $"sql-test-user-{Guid.NewGuid():N}";

        await repository.UpsertAsync(
            userId,
            UserSettingKeys.WorkingWorkspaceContinuity,
            serialized,
            CancellationToken.None);

        string? loaded = await repository.TryGetAsync(
            userId,
            UserSettingKeys.WorkingWorkspaceContinuity,
            CancellationToken.None);

        loaded.Should().Be(serialized);
    }

    private static WorkingWorkspaceContinuityDto BuildContinuityPayloadThatExceedsLegacyColumnWidth()
    {
        return new WorkingWorkspaceContinuityDto
        {
            FavoriteReviews =
            [
                new FavoriteReviewEntryDto
                {
                    RunId = "bd6632ec-2d21-468c-b142-f184b9c78d14",
                    Title = "Payments platform review",
                    PinnedAtUtc = "2026-09-13T12:00:00.000Z",
                },
            ],
            RecentViewEntries =
            [
                new OperatorRecentViewEntryDto
                {
                    Href = "/infrastructure/diagrams?snapshotId=bebcalaa-9fba-408a-b9ce-2794678c4281",
                    Label = "Infrastructure diagrams",
                    Kind = "page",
                    VisitedAtUtc = "2026-09-13T12:01:00.000Z",
                },
                new OperatorRecentViewEntryDto
                {
                    Href = "/architecture/architectures/bebcalaa-9fba-408a-b9ce-2794678c4281",
                    Label = "Architecture",
                    Kind = "architecture",
                    VisitedAtUtc = "2026-09-13T12:01:30.000Z",
                    ArchitectureId = "bebcalaa-9fba-408a-b9ce-2794678c4281",
                },
            ],
            UpdatedAtUtc = "2026-09-13T12:02:00.000Z",
        };
    }
}
