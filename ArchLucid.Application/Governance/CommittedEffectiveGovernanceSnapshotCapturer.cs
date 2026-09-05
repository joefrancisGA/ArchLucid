using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
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
    IPolicyPackRepository policyPackRepository,
    IPolicyPackVersionRepository policyPackVersionRepository) : ICommittedEffectiveGovernanceSnapshotCapturer
{
    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly EffectiveGovernanceSnapshotBuilder _snapshotBuilder = new();

    /// <inheritdoc />
    public Task ApplyToManifestAsync(ManifestDocument manifest, CancellationToken cancellationToken = default) =>
        ApplyToManifestAsync(manifest, options: null, cancellationToken);

    /// <inheritdoc />
    public async Task ApplyToManifestAsync(
        ManifestDocument manifest,
        CommittedEffectiveGovernanceSnapshotCaptureOptions? options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        EffectiveGovernanceResolutionResult resolution = await _effectiveGovernanceResolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        IReadOnlyList<PolicyPackAssignment> assignments = options?.PreloadedScopePolicyPackAssignments
            ?? throw new ConflictException(
                "Commit blocked: effective governance snapshot requires pin-derived policy pack assignments.");

        bool focusedPilotMode = options?.PinnedFocusedPilotModeEnabled == true
            || (options?.PinnedFocusedPilotModeEnabled is null && PilotModeGovernanceScope.IsActive);
        CloudProvider focusedPilotCloudProvider = options?.PinnedFocusedPilotCloudProvider is int raw
            ? (CloudProvider)raw
            : PilotModeGovernanceScope.ActiveCloudProvider;
        List<CommittedGovernancePackAssignmentSnapshot> packRows = [];
        List<ArchLucid.Contracts.Governance.PolicyPacks.PolicyPackAssignment> applicableAssignments = [];

        foreach (ArchLucid.Contracts.Governance.PolicyPacks.PolicyPackAssignment assignment in assignments)
        {
            if (!AppliesToScope(assignment, scope.TenantId, scope.WorkspaceId, scope.ProjectId))
                continue;

            if (!focusedPilotMode && !assignment.IsEnabled)
                continue;

            applicableAssignments.Add(assignment);
        }

        IReadOnlyList<ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack> loadedPacks = applicableAssignments.Count == 0
            ? Array.Empty<ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack>()
            : await _policyPackRepository.GetByIdsAsync(
                applicableAssignments.Select(static assignment => assignment.PolicyPackId).Distinct().ToList(),
                cancellationToken);

        Dictionary<Guid, ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack> packById =
            loadedPacks.ToDictionary(static pack => pack.PolicyPackId);

        foreach (ArchLucid.Contracts.Governance.PolicyPacks.PolicyPackAssignment assignment in applicableAssignments)
        {
            if (!packById.TryGetValue(assignment.PolicyPackId, out ArchLucid.Contracts.Governance.PolicyPacks.PolicyPack? pack))
                continue;

            if (focusedPilotMode && !FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
                    pack.Name,
                    PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment),
                    PlatformOverlayPolicyPacks.IsOverlayDisplayName(
                        pack.Name,
                        focusedPilotCloudProvider)))
                continue;

            packRows.Add(
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = assignment.PolicyPackId,
                    PolicyPackVersion = assignment.PolicyPackVersion,
                    ScopeLevel = GovernanceScopeLevel.TryNormalize(assignment.ScopeLevel) ?? GovernanceScopeLevel.Project,
                    ComplianceRuleKeys = await PolicyPackAssignmentComplianceRuleKeysResolver.ResolveForAssignmentAsync(
                        _policyPackVersionRepository,
                        assignment,
                        cancellationToken).ConfigureAwait(false),
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
        ArchLucid.Contracts.Governance.PolicyPacks.PolicyPackAssignment assignment,
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
