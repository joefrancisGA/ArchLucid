using System.Data;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed class SqlArchitectureVersionRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureVersionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<ArchitectureVersionRecord?> GetByContentHashAsync(
        ScopeContext scope,
        Guid architectureId,
        byte[] contentHashSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contentHashSha256);

        const string sql = """
                           SELECT TOP (1)
                               ArchitectureVersionId, ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                               VersionNumber, ContentHashSha256, IntakeRequestHashSha256, SourceRequestId, CreatedUtc
                           FROM dbo.ArchitectureVersions
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ContentHashSha256 = @ContentHashSha256;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureVersionRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ContentHashSha256 = contentHashSha256,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<int> GetLatestVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ISNULL(MAX(VersionNumber), 0)
                           FROM dbo.ArchitectureVersions
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<ArchitectureVersionRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureVersionRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);

        Guid architectureVersionId = record.ArchitectureVersionId == Guid.Empty
            ? Guid.NewGuid()
            : record.ArchitectureVersionId;

        DateTime createdUtc = record.CreatedUtc == default
            ? TimeProvider.System.GetUtcNow().UtcDateTime
            : record.CreatedUtc;

        const string sql = """
                           INSERT INTO dbo.ArchitectureVersions
                           (
                               ArchitectureVersionId, ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                               VersionNumber, ContentHashSha256, IntakeRequestHashSha256, SourceRequestId, CreatedUtc
                           )
                           VALUES
                           (
                               @ArchitectureVersionId, @ArchitectureId, @TenantId, @WorkspaceId, @ScopeProjectId,
                               @VersionNumber, @ContentHashSha256, @IntakeRequestHashSha256, @SourceRequestId, @CreatedUtc
                           );
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureVersionId = architectureVersionId,
                    ArchitectureId = record.ArchitectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    VersionNumber = record.VersionNumber,
                    ContentHashSha256 = record.ContentHashSha256,
                    IntakeRequestHashSha256 = record.IntakeRequestHashSha256.Length == 0
                        ? record.ContentHashSha256
                        : record.IntakeRequestHashSha256,
                    SourceRequestId = record.SourceRequestId,
                    CreatedUtc = createdUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return new ArchitectureVersionRecord
        {
            ArchitectureVersionId = architectureVersionId,
            ArchitectureId = record.ArchitectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            VersionNumber = record.VersionNumber,
            ContentHashSha256 = record.ContentHashSha256,
            IntakeRequestHashSha256 = record.IntakeRequestHashSha256.Length == 0
                ? record.ContentHashSha256
                : record.IntakeRequestHashSha256,
            SourceRequestId = record.SourceRequestId,
            CreatedUtc = createdUtc,
        };
    }

    public async Task<ArchitectureVersionRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureVersionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ArchitectureVersionId, ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                                  VersionNumber, ContentHashSha256, IntakeRequestHashSha256, SourceRequestId, CreatedUtc
                           FROM dbo.ArchitectureVersions
                           WHERE ArchitectureVersionId = @ArchitectureVersionId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureVersionRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureVersionId = architectureVersionId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<ArchitectureVersionRecord?> GetByArchitectureIdAndVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        int versionNumber,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty || versionNumber < 1)
            return null;

        const string sql = """
                           SELECT TOP (1)
                               ArchitectureVersionId, ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                               VersionNumber, ContentHashSha256, IntakeRequestHashSha256, SourceRequestId, CreatedUtc
                           FROM dbo.ArchitectureVersions
                           WHERE ArchitectureId = @ArchitectureId
                             AND VersionNumber = @VersionNumber
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureVersionRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    VersionNumber = versionNumber,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ArchitectureVersionRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT ArchitectureVersionId, ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                                  VersionNumber, ContentHashSha256, IntakeRequestHashSha256, SourceRequestId, CreatedUtc
                           FROM dbo.ArchitectureVersions
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                           ORDER BY VersionNumber DESC;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IEnumerable<ArchitectureVersionRecord> rows = await connection.QueryAsync<ArchitectureVersionRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows.ToList();
    }
}
