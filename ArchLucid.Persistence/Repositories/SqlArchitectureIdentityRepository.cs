using System.Data;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlArchitectureIdentityRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureIdentityRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        string displayName,
        string? currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        string normalizedDisplayName = ArchitectureIdentityDisplayNameDefaults.Resolve(displayName);
        Guid architectureId = Guid.NewGuid();
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
                           INSERT INTO dbo.Architectures
                           (
                               ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                               DisplayName, CurrentModelId, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @ArchitectureId, @TenantId, @WorkspaceId, @ScopeProjectId,
                               @DisplayName, @CurrentModelId, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DisplayName = normalizedDisplayName,
                    CurrentModelId = currentModelId,
                    CreatedUtc = nowUtc,
                    UpdatedUtc = nowUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return new ArchitectureIdentityRecord
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            DisplayName = normalizedDisplayName,
            CurrentModelId = currentModelId,
            CreatedUtc = nowUtc,
            UpdatedUtc = nowUtc,
        };
    }

    public async Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ArchitectureId, TenantId, WorkspaceId, ScopeProjectId,
                                  DisplayName, Description, CurrentModelId, LatestSealedManifestId,
                                  CreatedUtc, UpdatedUtc
                           FROM dbo.Architectures
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureIdentityRecord>(
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

    public async Task UpdateCurrentModelAsync(
        ScopeContext scope,
        Guid architectureId,
        string currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(currentModelId);

        const string sql = """
                           UPDATE dbo.Architectures
                           SET CurrentModelId = @CurrentModelId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    CurrentModelId = currentModelId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task UpdateLatestSealedManifestAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid manifestId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           UPDATE dbo.Architectures
                           SET LatestSealedManifestId = @LatestSealedManifestId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    LatestSealedManifestId = manifestId,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    public async Task<bool> TryUpdateDisplayNameWhenUntitledAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        string normalizedDisplayName = ArchitectureIdentityDisplayNameDefaults.Resolve(displayName);

        const string sql = """
                           UPDATE dbo.Architectures
                           SET DisplayName = @DisplayName,
                               UpdatedUtc = @UpdatedUtc
                           WHERE ArchitectureId = @ArchitectureId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND DisplayName = @UntitledDisplayName;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    ArchitectureId = architectureId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DisplayName = normalizedDisplayName,
                    UntitledDisplayName = ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture,
                    UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows > 0;
    }
}
