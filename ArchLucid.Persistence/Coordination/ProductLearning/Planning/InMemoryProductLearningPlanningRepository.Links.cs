using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

public sealed partial class InMemoryProductLearningPlanningRepository
{
    public Task AddPlanArchitectureRunLinkAsync(
        ProductLearningImprovementPlanRunLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureRunLink(link);

        ProductLearningImprovementPlanRecord? plan = _plans.FirstOrDefault(p => p.PlanId == link.PlanId);

        if (plan is null)
            throw new InvalidOperationException("Plan not found for PlanId=" + link.PlanId + ".");


        if (_runLinks.Any(r =>
                r.PlanId == link.PlanId &&
                string.Equals(r.ArchitectureRunId, link.ArchitectureRunId, StringComparison.Ordinal)))

            throw new InvalidOperationException("Run link already exists for this plan.");


        _runLinks.Add(
            new ProductLearningImprovementPlanRunLinkRecord
            {
                PlanId = link.PlanId, ArchitectureRunId = link.ArchitectureRunId
            });

        return Task.CompletedTask;
    }

    public Task AddPlanSignalLinkAsync(
        ProductLearningImprovementPlanSignalLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureSignalLink(link);

        ProductLearningImprovementPlanRecord? plan = _plans.FirstOrDefault(p => p.PlanId == link.PlanId);

        if (plan is null)
            throw new InvalidOperationException("Plan not found for PlanId=" + link.PlanId + ".");


        if (_signalLinks.Any(s => s.PlanId == link.PlanId && s.SignalId == link.SignalId))

            throw new InvalidOperationException("Signal link already exists for this plan.");


        _signalLinks.Add(
            new ProductLearningImprovementPlanSignalLinkRecord
            {
                PlanId = link.PlanId, SignalId = link.SignalId, TriageStatusSnapshot = link.TriageStatusSnapshot
            });

        return Task.CompletedTask;
    }

    public Task AddPlanArtifactLinkAsync(
        ProductLearningImprovementPlanArtifactLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureArtifactLink(link);

        ProductLearningImprovementPlanRecord? plan = _plans.FirstOrDefault(p => p.PlanId == link.PlanId);

        if (plan is null)
            throw new InvalidOperationException("Plan not found for PlanId=" + link.PlanId + ".");


        Guid linkId = link.LinkId == Guid.Empty ? Guid.NewGuid() : link.LinkId;

        _artifactLinks.Add(
            new ProductLearningImprovementPlanArtifactLinkRecord
            {
                LinkId = linkId,
                PlanId = link.PlanId,
                AuthorityBundleId = link.AuthorityBundleId,
                AuthorityArtifactSortOrder = link.AuthorityArtifactSortOrder,
                PilotArtifactHint = link.PilotArtifactHint
            });

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<string>> ListPlanArchitectureRunIdsAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        if (!_plans.Any(p =>
                p.PlanId == planId &&
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId))

            return Task.FromResult<IReadOnlyList<string>>([]);


        List<string> ids = _runLinks
            .Where(r => r.PlanId == planId)
            .Select(static r => r.ArchitectureRunId)
            .OrderBy(static id => id, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult<IReadOnlyList<string>>(ids);
    }

    public Task<IReadOnlyList<ProductLearningImprovementPlanSignalLinkRecord>> ListPlanSignalLinksAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        if (!_plans.Any(p =>
                p.PlanId == planId &&
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId))

            return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanSignalLinkRecord>>(
                []);


        List<ProductLearningImprovementPlanSignalLinkRecord> list = _signalLinks
            .Where(s => s.PlanId == planId)
            .OrderBy(static s => s.SignalId)
            .Select(static s => new ProductLearningImprovementPlanSignalLinkRecord
            {
                PlanId = s.PlanId, SignalId = s.SignalId, TriageStatusSnapshot = s.TriageStatusSnapshot
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanSignalLinkRecord>>(list);
    }

    public Task<IReadOnlyList<ProductLearningImprovementPlanArtifactLinkRecord>> ListPlanArtifactLinksAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        if (!_plans.Any(p =>
                p.PlanId == planId &&
                p.TenantId == scope.TenantId &&
                p.WorkspaceId == scope.WorkspaceId &&
                p.ProjectId == scope.ProjectId))

            return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanArtifactLinkRecord>>(
                []);


        List<ProductLearningImprovementPlanArtifactLinkRecord> list = _artifactLinks
            .Where(a => a.PlanId == planId)
            .OrderBy(static a => a.LinkId)
            .Select(static a => new ProductLearningImprovementPlanArtifactLinkRecord
            {
                LinkId = a.LinkId,
                PlanId = a.PlanId,
                AuthorityBundleId = a.AuthorityBundleId,
                AuthorityArtifactSortOrder = a.AuthorityArtifactSortOrder,
                PilotArtifactHint = a.PilotArtifactHint
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementPlanArtifactLinkRecord>>(list);
    }
}
