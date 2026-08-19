using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.OperatorHome;

public sealed class FeaturedCompletedSampleService(
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository,
    IRunRepository runRepository) : IFeaturedCompletedSampleService
{
    private const int CandidateListLimit = 100;

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<FeaturedCompletedSampleSnapshot> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? selectedRunId = await TryReadSelectedRunIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (!selectedRunId.HasValue)
        {
            return new FeaturedCompletedSampleSnapshot
            {
                IsConfigured = false,
                IsAvailable = false,
            };
        }

        return await ProjectSnapshotAsync(scope, selectedRunId.Value, isConfigured: true, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<FeaturedCompletedSampleCandidate>> ListEligibleCandidatesAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<RunRecord> runs = await _runRepository
            .ListRecentInScopeAsync(scope, CandidateListLimit, cancellationToken)
            .ConfigureAwait(false);

        return runs
            .Where(FeaturedCompletedSampleEligibility.IsEligible)
            .Select(ProjectCandidate)
            .OrderByDescending(static candidate => candidate.CompletedUtc)
            .ToArray();
    }

    public async Task<FeaturedCompletedSampleSnapshot> SetSelectedRunIdAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null || !FeaturedCompletedSampleEligibility.IsEligible(run))
        {
            throw new InvalidOperationException("The selected review is not eligible for workspace sample use.");
        }

        await _tenantSettingsRepository
            .UpsertAsync(
                scope.TenantId,
                TenantSettingKeys.FeaturedCompletedSampleRunId,
                runId.ToString("D"),
                cancellationToken)
            .ConfigureAwait(false);

        return await ProjectSnapshotAsync(scope, runId, isConfigured: true, cancellationToken).ConfigureAwait(false);
    }

    public async Task<FeaturedCompletedSampleSnapshot> ClearSelectionAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await _tenantSettingsRepository
            .DeleteAsync(scope.TenantId, TenantSettingKeys.FeaturedCompletedSampleRunId, cancellationToken)
            .ConfigureAwait(false);

        return new FeaturedCompletedSampleSnapshot
        {
            IsConfigured = false,
            IsAvailable = false,
        };
    }

    private async Task<Guid?> TryReadSelectedRunIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        string? stored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.FeaturedCompletedSampleRunId, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(stored))
        {
            return null;
        }

        if (!Guid.TryParse(stored.Trim(), out Guid runId))
        {
            return null;
        }

        return runId;
    }

    private async Task<FeaturedCompletedSampleSnapshot> ProjectSnapshotAsync(
        ScopeContext scope,
        Guid runId,
        bool isConfigured,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null || !FeaturedCompletedSampleEligibility.IsEligible(run))
        {
            return new FeaturedCompletedSampleSnapshot
            {
                SelectedRunId = runId,
                IsConfigured = isConfigured,
                IsAvailable = false,
            };
        }

        return new FeaturedCompletedSampleSnapshot
        {
            SelectedRunId = runId,
            IsConfigured = isConfigured,
            IsAvailable = true,
            ReviewTitle = FeaturedCompletedSampleEligibility.ResolveReviewTitle(run),
            ArchitectureName = FeaturedCompletedSampleEligibility.ResolveArchitectureName(run),
            CompletedUtc = FeaturedCompletedSampleEligibility.ResolveCompletedUtc(run),
            IsSampleApproved = FeaturedCompletedSampleEligibility.IsSampleApproved(run),
        };
    }

    private static FeaturedCompletedSampleCandidate ProjectCandidate(RunRecord run)
    {
        return new FeaturedCompletedSampleCandidate
        {
            RunId = run.RunId,
            ReviewTitle = FeaturedCompletedSampleEligibility.ResolveReviewTitle(run),
            ArchitectureName = FeaturedCompletedSampleEligibility.ResolveArchitectureName(run),
            CompletedUtc = FeaturedCompletedSampleEligibility.ResolveCompletedUtc(run),
            IsSampleApproved = FeaturedCompletedSampleEligibility.IsSampleApproved(run),
        };
    }
}
