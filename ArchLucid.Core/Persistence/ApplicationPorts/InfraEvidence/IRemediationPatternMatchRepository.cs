using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPatternMatchRepository
{
    Task DeactivateMatchesForFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task DeactivateMatchesForFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        DeactivateMatchesForFindingAsync(scope.TenantId, findingId, cancellationToken);

    Task InsertMatchResultAsync(
        RemediationPatternMatchResultRecord matchResult,
        CancellationToken cancellationToken = default);

    Task InsertMatchResultInScopeAsync(
        ProjectScopeKey scope,
        RemediationPatternMatchResultRecord matchResult,
        CancellationToken cancellationToken = default) =>
        InsertMatchResultAsync(matchResult, cancellationToken);

    Task InsertConflictAsync(
        RemediationPatternMatchConflictRecord conflict,
        CancellationToken cancellationToken = default);

    Task InsertConflictInScopeAsync(
        ProjectScopeKey scope,
        RemediationPatternMatchConflictRecord conflict,
        CancellationToken cancellationToken = default) =>
        InsertConflictAsync(conflict, cancellationToken);

    Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        TryGetActiveMatchAsync(scope.TenantId, findingId, cancellationToken);

    async Task<IReadOnlyDictionary<Guid, RemediationPatternMatchResultRecord>> ListActiveMatchesByOpenFindingInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        Dictionary<Guid, RemediationPatternMatchResultRecord> matches = new();

        foreach (RemediationPatternMatchResultRecord match in await ListActiveMatchesForOpenFindingsInScopeAsync(scope, cancellationToken))
        {
            matches[match.FindingId] = match;
        }

        return matches;
    }

    Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListActiveMatchesForOpenFindingsInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        ListByFindingAsync(scope.TenantId, findingId, cancellationToken);

    Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        ListConflictsByFindingAsync(scope.TenantId, findingId, cancellationToken);
}
