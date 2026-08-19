using ArchLucid.Application;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance.Coverage;

public sealed class CoverageQueryService(
    ICoverageAssignmentRepository coverageAssignmentRepository,
    IPolicyPackRepository policyPackRepository,
    IRunRepository runRepository) : ICoverageQueryService
{
    private readonly ICoverageAssignmentRepository _coverageAssignmentRepository =
        coverageAssignmentRepository ?? throw new ArgumentNullException(nameof(coverageAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<CoverageSummary> GetByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId.ToString("N"));

        string runIdKey = runId.ToString("N");
        IReadOnlyList<CoverageAssignment> assignments =
            await _coverageAssignmentRepository.ListByRunIdAsync(scope, runIdKey, cancellationToken);

        return await BuildSummaryAsync(assignments, cancellationToken);
    }

    public async Task<CoverageSummary> GetByScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<CoverageAssignment> assignments = await _coverageAssignmentRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        return await BuildSummaryAsync(assignments, cancellationToken);
    }

    private async Task<CoverageSummary> BuildSummaryAsync(
        IReadOnlyList<CoverageAssignment> assignments,
        CancellationToken cancellationToken)
    {
        if (assignments.Count == 0)
        {
            return new CoverageSummary
            {
                LegacyCoverageNotRecorded = true,
                Assignments = Array.Empty<CoverageAssignment>(),
            };
        }

        IReadOnlyList<PolicyPack> packs = await _policyPackRepository.GetByIdsAsync(
            assignments.Select(static row => row.PolicyPackId).Distinct().ToList(),
            cancellationToken);

        Dictionary<Guid, PolicyPack> packById = packs.ToDictionary(static pack => pack.PolicyPackId);

        // QualityDimension is resolved from PolicyPack at read time; assignments do not duplicate it.
        _ = packById;

        return new CoverageSummary
        {
            LegacyCoverageNotRecorded = false,
            ProviderNeutralBaselineCount = assignments.Count(static row => row.CoverageType == CoverageType.ProviderNeutralBaseline),
            OrganizationRequiredCount = assignments.Count(static row => row.CoverageType == CoverageType.OrganizationRequired),
            PlatformOverlayCount = assignments.Count(static row => row.CoverageType == CoverageType.PlatformOverlay),
            ContextualRecommendedCount = assignments.Count(static row => row.CoverageType == CoverageType.ContextualRecommended),
            AdditionalOptionalCount = assignments.Count(static row => row.CoverageType == CoverageType.AdditionalOptional),
            Assignments = assignments,
        };
    }
}
