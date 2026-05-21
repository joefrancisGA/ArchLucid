using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Search;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Search;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed class SqlGlobalSearchRepository(ISqlConnectionFactory connectionFactory) : IGlobalSearchRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<GlobalSearchResult> SearchAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string query,
        int takePerCategory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new GlobalSearchResult();
        }

        string like = $"%{EscapeLike(query.Trim())}%";
        int take = Math.Clamp(takePerCategory, 1, 25);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RunRow> runRows = await connection.QueryAsync<RunRow>(
            new CommandDefinition(
                """
                SELECT TOP (@Take) RunId, Description, ProjectId AS AuthorityProjectSlug, CreatedUtc
                FROM dbo.Runs
                WHERE TenantId = @TenantId
                  AND WorkspaceId = @WorkspaceId
                  AND ScopeProjectId = @ScopeProjectId
                  AND ArchivedUtc IS NULL
                  AND (Description LIKE @Like ESCAPE '\' OR CAST(RunId AS NVARCHAR(36)) LIKE @Like ESCAPE '\')
                ORDER BY CreatedUtc DESC;
                """,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId,
                    Like = like,
                    Take = take,
                },
                cancellationToken: cancellationToken));

        IEnumerable<FindingRow> findingRows = await connection.QueryAsync<FindingRow>(
            new CommandDefinition(
                """
                SELECT TOP (@Take) r.RunId, fr.FindingId, fr.Title, fr.Severity
                FROM dbo.FindingRecords AS fr
                INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                INNER JOIN dbo.Runs AS r ON r.FindingsSnapshotId = fs.FindingsSnapshotId
                WHERE fr.TenantId = @TenantId
                  AND fr.WorkspaceId = @WorkspaceId
                  AND fr.ProjectId = @ScopeProjectId
                  AND r.ArchivedUtc IS NULL
                  AND (fr.Title LIKE @Like ESCAPE '\' OR fr.FindingId LIKE @Like ESCAPE '\')
                ORDER BY fr.SortOrder ASC;
                """,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId,
                    Like = like,
                    Take = take,
                },
                cancellationToken: cancellationToken));

        IEnumerable<PolicyPackRow> packRows = await connection.QueryAsync<PolicyPackRow>(
            new CommandDefinition(
                """
                SELECT TOP (@Take) PolicyPackId, Name, CAST(0 AS BIT) AS IsCatalogEntry
                FROM dbo.PolicyPacks
                WHERE TenantId = @TenantId
                  AND WorkspaceId = @WorkspaceId
                  AND ProjectId = @ScopeProjectId
                  AND Name LIKE @Like ESCAPE '\'
                ORDER BY CreatedUtc DESC;
                """,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId,
                    Like = like,
                    Take = take,
                },
                cancellationToken: cancellationToken));

        return new GlobalSearchResult
        {
            Runs = runRows.Select(static r => r.ToHit()).ToList(),
            Findings = findingRows.Select(static r => r.ToHit()).ToList(),
            PolicyPacks = packRows.Select(static r => r.ToHit()).ToList(),
        };
    }

    private static string EscapeLike(string input) => input.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private sealed class RunRow
    {
        public Guid RunId
        {
            get;
            init;
        }

        public string? Description
        {
            get;
            init;
        }

        public string? AuthorityProjectSlug
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public GlobalSearchRunHit ToHit()
        {
            return new GlobalSearchRunHit
            {
                RunId = RunId,
                Description = Description,
                AuthorityProjectSlug = AuthorityProjectSlug,
                CreatedUtc = new DateTimeOffset(DateTime.SpecifyKind(CreatedUtc, DateTimeKind.Utc)),
            };
        }
    }

    private sealed class FindingRow
    {
        public Guid RunId
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string Severity
        {
            get;
            init;
        } = string.Empty;

        public GlobalSearchFindingHit ToHit()
        {
            return new GlobalSearchFindingHit
            {
                RunId = RunId,
                FindingId = FindingId,
                Title = Title,
                Severity = Severity,
            };
        }
    }

    private sealed class PolicyPackRow
    {
        public Guid PolicyPackId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public bool IsCatalogEntry
        {
            get;
            init;
        }

        public GlobalSearchPolicyPackHit ToHit()
        {
            return new GlobalSearchPolicyPackHit
            {
                PolicyPackId = PolicyPackId,
                Name = Name,
                IsCatalogEntry = IsCatalogEntry,
            };
        }
    }
}
