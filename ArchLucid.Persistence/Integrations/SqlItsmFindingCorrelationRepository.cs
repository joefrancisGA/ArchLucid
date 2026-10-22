using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Integrations;

/// <summary>
///     Non-RLS SQL access for ITSM correlation and finding-row updates (anonymous inbound webhooks have no session
///     scope).
/// </summary>
/// <remarks>
///     Implementation lives in <c>SqlItsmFindingCorrelationRepository.{Query|Write|Resolve}.cs</c> partials.
///     The type remains one <see cref="IItsmFindingCorrelationRepository" /> implementation and DI registration.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL integration; exercised via API integration tests.")]
public sealed partial class SqlItsmFindingCorrelationRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : IItsmFindingCorrelationRepository
{
    private const string CorrelationSelectColumns =
        "TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey, ExternalSysId, CreatedUtc, FindingRecordId";

    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyCoreAsync(provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyForTenantCoreAsync(tenantId, provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => RegisterCoreAsync(
                tenantId,
                workspaceId,
                projectId,
                findingId,
                provider,
                externalKey,
                externalSysId,
                findingRecordId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<Guid?> TryResolveFindingRecordIdForRunFindingAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryResolveFindingRecordIdForRunFindingCoreAsync(
                tenantId,
                runId,
                findingId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<Guid?> TryResolveLatestCommittedFindingRecordIdAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryResolveLatestCommittedFindingRecordIdCoreAsync(
                tenantId,
                findingId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => UpdateExternalTrackingCoreAsync(
                tenantId,
                workspaceId,
                projectId,
                findingId,
                provider,
                externalKey,
                externalSysId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> RemoveByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => RemoveByFindingAndProviderCoreAsync(tenantId, findingId, provider, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => UpdateHumanReviewStatusForFindingCoreAsync(
                tenantId,
                findingId,
                humanReviewStatus,
                findingRecordId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<bool> FindingRecordExistsAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => FindingRecordExistsCoreAsync(tenantId, findingId, findingRecordId, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByFindingAndProviderCoreAsync(tenantId, findingId, provider, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => ListByFindingCoreAsync(tenantId, findingId, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => ListByFindingsCoreAsync(tenantId, findingIds, cancellationToken),
            ct);
}
