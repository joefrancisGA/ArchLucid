using ArchLucid.Application;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IWorkspaceSystemNameCollisionGuard" />
public sealed class WorkspaceSystemNameCollisionGuard(
    IRunRepository runRepository,
    IDraftRequestRepository draftRequestRepository) : IWorkspaceSystemNameCollisionGuard
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    /// <inheritdoc />
    public async Task EnsureAvailableAsync(
        ScopeContext scope,
        string systemName,
        Guid? excludeDraftId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemName);

        string trimmedName = systemName.Trim();
        string? normalizedName = WorkspaceSystemNameNormalizer.NormalizeOrNull(trimmedName);

        if (normalizedName is null)
            return;

        bool runExists = await _runRepository
            .ExistsActiveRunWithSystemNameInWorkspaceAsync(scope, trimmedName, cancellationToken)
            .ConfigureAwait(false);

        if (runExists)
            throw BuildConflictException(trimmedName);

        bool draftExists = await _draftRequestRepository
            .ExistsMutableDraftWithSystemNameInWorkspaceAsync(
                scope.TenantId,
                scope.WorkspaceId,
                trimmedName,
                excludeDraftId,
                cancellationToken)
            .ConfigureAwait(false);

        if (draftExists)
            throw BuildConflictException(trimmedName);
    }

    private static ConflictException BuildConflictException(string systemName) =>
        new($"A review or architecture named '{systemName}' already exists in this workspace.");
}
