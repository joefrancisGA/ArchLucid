using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Decorates <see cref="DefaultEvidenceBuilder" /> with workspace-effective policy pack policies.
/// </summary>
public sealed class WorkspacePolicyPackEvidenceBuilder(
    DefaultEvidenceBuilder innerBuilder,
    EffectiveGovernanceSnapshotBuilder governanceSnapshotBuilder,
    IEffectiveGovernanceResolver effectiveGovernanceResolver,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackRepository policyPackRepository,
    IScopeContextProvider scopeContextProvider) : IEvidenceBuilder
{
    private readonly DefaultEvidenceBuilder _innerBuilder =
        innerBuilder ?? throw new ArgumentNullException(nameof(innerBuilder));

    private readonly EffectiveGovernanceSnapshotBuilder _governanceSnapshotBuilder =
        governanceSnapshotBuilder ?? throw new ArgumentNullException(nameof(governanceSnapshotBuilder));

    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<AgentEvidencePackage> BuildAsync(
        string runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        AgentEvidencePackage package = await _innerBuilder.BuildAsync(runId, request, cancellationToken);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        EffectiveGovernanceSnapshotResolution resolution = await _governanceSnapshotBuilder.ResolveAsync(
            scope,
            request,
            _effectiveGovernanceResolver,
            _policyPackAssignmentRepository,
            _policyPackRepository,
            preloadedScopePolicyPackAssignments: null,
            cancellationToken);

        foreach (CommittedGovernancePackAssignmentSnapshot assignment in resolution.PackAssignments)
        {
            string policyPackId = assignment.PolicyPackId.ToString("D");

            package.Policies.Add(new PolicyEvidence
            {
                PolicyId = policyPackId,
                Title = $"Policy pack {assignment.PolicyPackVersion}",
                Summary = $"Workspace-effective policy pack assignment ({assignment.ScopeLevel}).",
                Tags = ["workspace-policy-pack"],
            });
        }

        return package;
    }
}
