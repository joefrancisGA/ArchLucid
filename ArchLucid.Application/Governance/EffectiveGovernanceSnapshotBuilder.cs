using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Resolved pack rows and coverage scope for effective-governance snapshots.</summary>
public sealed class EffectiveGovernanceSnapshotResolution
{
    public List<CommittedGovernancePackAssignmentSnapshot> PackAssignments
    {
        get;
        init;
    } = [];

    public List<CommittedCoverageAssignmentSnapshot> CoverageAssignments
    {
        get;
        init;
    } = [];

    public List<NotAssessedQualityDimensionSnapshot> NotAssessedQualityDimensions
    {
        get;
        init;
    } = [];

    public List<string> ComplianceRuleKeys
    {
        get;
        init;
    } = [];

    public int ConflictCount
    {
        get;
        init;
    }

    public bool HasEffectivePolicy
    {
        get;
        init;
    }
}

/// <summary>Builds effective-governance snapshot slices shared by execute-time and commit-time capturers.</summary>
public sealed class EffectiveGovernanceSnapshotBuilder
{
    public const string ExecuteScopeEvaluationVersion = "execute-scope-v1";

    public const string DisabledAssignmentExclusionReason =
        "Policy pack assignment is disabled for this scope.";

    public const string FocusedPilotExclusionReason =
        "Excluded by focused pilot mode for this review.";

    public const string NotAssessedBaselineReason =
        "No enabled baseline policy pack covers this dimension for this review.";

    public async Task<EffectiveGovernanceSnapshotResolution> ResolveAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        IEffectiveGovernanceResolver effectiveGovernanceResolver,
        IPolicyPackAssignmentRepository policyPackAssignmentRepository,
        IPolicyPackRepository policyPackRepository,
        IReadOnlyList<PolicyPackAssignment>? preloadedScopePolicyPackAssignments,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(effectiveGovernanceResolver);
        ArgumentNullException.ThrowIfNull(policyPackAssignmentRepository);
        ArgumentNullException.ThrowIfNull(policyPackRepository);

        EffectiveGovernanceResolutionResult resolution = await effectiveGovernanceResolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        IReadOnlyList<PolicyPackAssignment> assignments = preloadedScopePolicyPackAssignments
            ?? await policyPackAssignmentRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        bool focusedPilotMode = PilotModeGovernanceScope.IsActive
            || FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(request.PolicyReferences);

        List<PolicyPackAssignment> scopeAssignments = assignments
            .Where(assignment => AppliesToScope(assignment, scope.TenantId, scope.WorkspaceId, scope.ProjectId))
            .ToList();

        IReadOnlyList<PolicyPack> loadedPacks = scopeAssignments.Count == 0
            ? Array.Empty<PolicyPack>()
            : await policyPackRepository.GetByIdsAsync(
                scopeAssignments.Select(static assignment => assignment.PolicyPackId).Distinct().ToList(),
                cancellationToken);

        Dictionary<Guid, PolicyPack> packById = loadedPacks.ToDictionary(static pack => pack.PolicyPackId);
        HashSet<Guid> evaluatedPackIds = [];
        List<CommittedGovernancePackAssignmentSnapshot> packRows = [];
        List<CommittedCoverageAssignmentSnapshot> coverageRows = [];

        foreach (PolicyPackAssignment assignment in scopeAssignments)
        {
            if (!packById.TryGetValue(assignment.PolicyPackId, out PolicyPack? pack))
                continue;

            if (focusedPilotMode && !FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
                    pack.Name,
                    assignment.IsPinned,
                    PlatformOverlayPolicyPacks.IsOverlayDisplayName(pack.Name, request.CloudProvider)))
            {
                coverageRows.Add(
                    BuildCoverageSnapshot(
                        assignment,
                        pack,
                        CoverageType.AdditionalOptional,
                        CoverageSelectionState.RecommendedButExcluded,
                        exclusionReason: FocusedPilotExclusionReason));

                continue;
            }

            if (!assignment.IsEnabled)
            {
                coverageRows.Add(
                    BuildCoverageSnapshot(
                        assignment,
                        pack,
                        ResolveCoverageType(pack),
                        CoverageSelectionState.RecommendedButExcluded,
                        exclusionReason: DisabledAssignmentExclusionReason));

                continue;
            }

            evaluatedPackIds.Add(assignment.PolicyPackId);
            packRows.Add(
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = assignment.PolicyPackId,
                    PolicyPackVersion = assignment.PolicyPackVersion,
                    ScopeLevel = GovernanceScopeLevel.TryNormalize(assignment.ScopeLevel) ?? GovernanceScopeLevel.Project
                });

            coverageRows.Add(
                BuildCoverageSnapshot(
                    assignment,
                    pack,
                    ResolveCoverageType(pack),
                    ResolveSelectedState(pack),
                    exclusionReason: null));
        }

        packRows = packRows
            .OrderBy(row => row.PolicyPackId)
            .ThenBy(row => row.PolicyPackVersion, StringComparer.Ordinal)
            .ThenBy(row => row.ScopeLevel, StringComparer.Ordinal)
            .ToList();

        coverageRows = coverageRows
            .OrderBy(row => row.PolicyPackId)
            .ThenBy(row => row.PolicyPackVersion, StringComparer.Ordinal)
            .ThenBy(row => row.CoverageType, StringComparer.Ordinal)
            .ToList();

        List<string> complianceRuleKeys = resolution.EffectiveContent.ComplianceRuleKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(key => key, StringComparer.OrdinalIgnoreCase)
            .ToList();

        HashSet<QualityDimension> assessedBaselineDimensions = packRows
            .Select(row => row.PolicyPackId)
            .Select(packId => packById.TryGetValue(packId, out PolicyPack? pack) ? pack.QualityDimension : null)
            .Where(dimension => dimension.HasValue)
            .Select(dimension => dimension!.Value)
            .ToHashSet();

        HashSet<QualityDimension> excludedBaselineDimensions = coverageRows
            .Where(row => row.SelectionState == CoverageSelectionState.RecommendedButExcluded.ToString())
            .Select(row => row.QualityDimension)
            .Where(dimension => !string.IsNullOrWhiteSpace(dimension))
            .Select(dimension => Enum.Parse<QualityDimension>(dimension!))
            .ToHashSet();

        List<NotAssessedQualityDimensionSnapshot> notAssessedDimensions = Enum
            .GetValues<QualityDimension>()
            .Where(dimension => !assessedBaselineDimensions.Contains(dimension)
                && !excludedBaselineDimensions.Contains(dimension))
            .OrderBy(dimension => dimension.ToString(), StringComparer.Ordinal)
            .Select(dimension => new NotAssessedQualityDimensionSnapshot
            {
                QualityDimension = dimension.ToString(),
                Reason = NotAssessedBaselineReason
            })
            .ToList();

        bool hasEffectivePolicy = packRows.Count > 0 || complianceRuleKeys.Count > 0;

        return new EffectiveGovernanceSnapshotResolution
        {
            PackAssignments = packRows,
            CoverageAssignments = coverageRows,
            NotAssessedQualityDimensions = notAssessedDimensions,
            ComplianceRuleKeys = complianceRuleKeys,
            ConflictCount = resolution.Conflicts.Count,
            HasEffectivePolicy = hasEffectivePolicy
        };
    }

    private static CommittedCoverageAssignmentSnapshot BuildCoverageSnapshot(
        PolicyPackAssignment assignment,
        PolicyPack pack,
        CoverageType coverageType,
        CoverageSelectionState selectionState,
        string? exclusionReason) =>
        new()
        {
            PolicyPackId = assignment.PolicyPackId,
            PolicyPackVersion = assignment.PolicyPackVersion,
            CoverageType = coverageType.ToString(),
            SelectionState = selectionState.ToString(),
            QualityDimension = pack.QualityDimension?.ToString(),
            ExclusionReason = exclusionReason,
            EvaluationVersion = ExecuteScopeEvaluationVersion
        };

    private static CoverageType ResolveCoverageType(PolicyPack pack)
    {
        if (pack.QualityDimension.HasValue)
            return CoverageType.ProviderNeutralBaseline;

        string name = pack.Name;

        if (DefaultPolicyPackCatalog.AzureCloudSpecificStandardBaselineDisplayNames.Contains(name)
            || DefaultPolicyPackCatalog.AwsCloudSpecificStandardBaselineDisplayNames.Contains(name)
            || DefaultPolicyPackCatalog.GcpCloudSpecificStandardBaselineDisplayNames.Contains(name))
        {
            return CoverageType.PlatformOverlay;
        }

        return CoverageType.AdditionalOptional;
    }

    private static CoverageSelectionState ResolveSelectedState(PolicyPack pack) =>
        pack.QualityDimension.HasValue
            ? CoverageSelectionState.AlwaysActive
            : CoverageSelectionState.OptionalAndSelected;

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
