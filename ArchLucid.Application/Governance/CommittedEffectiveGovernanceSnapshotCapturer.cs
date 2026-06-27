using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="ICommittedEffectiveGovernanceSnapshotCapturer" />
public sealed class CommittedEffectiveGovernanceSnapshotCapturer(
    IScopeContextProvider scopeContextProvider,
    IEffectiveGovernanceResolver effectiveGovernanceResolver,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackRepository policyPackRepository) : ICommittedEffectiveGovernanceSnapshotCapturer
{
    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task ApplyToManifestAsync(ManifestDocument manifest, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        EffectiveGovernanceResolutionResult resolution = await _effectiveGovernanceResolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        bool focusedPilotMode = PilotModeGovernanceScope.IsActive;
        List<CommittedGovernancePackAssignmentSnapshot> packRows = [];

        foreach (PolicyPackAssignment assignment in assignments)
        {
            if (!AppliesToScope(assignment, scope.TenantId, scope.WorkspaceId, scope.ProjectId))
                continue;

            if (!focusedPilotMode && !assignment.IsEnabled)
                continue;

            PolicyPack? pack = await _policyPackRepository.GetByIdAsync(assignment.PolicyPackId, cancellationToken);

            if (pack is null)
                continue;

            if (focusedPilotMode && !FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(pack.Name))
                continue;

            packRows.Add(
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = assignment.PolicyPackId,
                    PolicyPackVersion = assignment.PolicyPackVersion,
                    ScopeLevel = GovernanceScopeLevel.TryNormalize(assignment.ScopeLevel) ?? GovernanceScopeLevel.Project
                });
        }

        packRows = packRows
            .OrderBy(row => row.PolicyPackId)
            .ThenBy(row => row.PolicyPackVersion, StringComparer.Ordinal)
            .ThenBy(row => row.ScopeLevel, StringComparer.Ordinal)
            .ToList();

        List<string> complianceRuleKeys = resolution.EffectiveContent.ComplianceRuleKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(key => key, StringComparer.OrdinalIgnoreCase)
            .ToList();

        bool hasEffectivePolicy = packRows.Count > 0 || complianceRuleKeys.Count > 0;

        manifest.EffectiveGovernanceAtCommit = new CommittedEffectiveGovernanceSnapshotDescriptor
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            RuleSetId = manifest.RuleSetId,
            RuleSetVersion = manifest.RuleSetVersion,
            RuleSetHash = manifest.RuleSetHash,
            ComplianceRuleKeyCount = complianceRuleKeys.Count,
            ComplianceRuleKeys = complianceRuleKeys,
            ConflictCount = resolution.Conflicts.Count,
            PackAssignments = packRows,
            HasEffectivePolicy = hasEffectivePolicy
        };
    }

    private static bool AppliesToScope(
        PolicyPackAssignment assignment,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        if (assignment.TenantId != tenantId)
            return false;

        return assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => true,
            GovernanceScopeLevel.Workspace => assignment.WorkspaceId == workspaceId,
            GovernanceScopeLevel.Project => assignment.WorkspaceId == workspaceId && assignment.ProjectId == projectId,
            _ => false
        };
    }
}
