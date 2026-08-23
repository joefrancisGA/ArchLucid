using ArchLucid.Application.Drafts;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage;

public sealed class CoveragePreviewService(
    IPolicyPackRepository packRepository,
    IPolicyPackAssignmentRepository assignmentRepository) : ICoveragePreviewService
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

    public async Task<CoveragePreviewResult> PreviewAsync(
        ScopeContext scope,
        CoveragePreviewInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(input);

        IReadOnlyList<PolicyPack> packs =
            await _packRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken);

        IReadOnlyList<PolicyPackAssignment> assignments =
            await _assignmentRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        Dictionary<string, PolicyPack> packByName = packs
            .Where(pack => !pack.IsDeleted)
            .GroupBy(pack => pack.Name, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<Guid, PolicyPackAssignment> assignmentByPackId = assignments
            .Where(assignment => AppliesToScope(assignment, scope))
            .GroupBy(assignment => assignment.PolicyPackId)
            .ToDictionary(group => group.Key, group => group.First());

        List<CoveragePreviewAssignment> rows = [];
        HashSet<Guid> seenPackIds = [];

        foreach (KeyValuePair<string, QualityDimension> baseline in DefaultPolicyPackCatalog.ProviderNeutralBaselineQualityDimensions)
        {
            if (!packByName.TryGetValue(baseline.Key, out PolicyPack? pack))
                continue;

            PolicyPackAssignment? assignment = assignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
            bool included = ResolveIncludedInRunEvaluation(
                pack.Name,
                assignment,
                input.FocusedPilotModeEnabled,
                input.CloudProvider);

            rows.Add(
                CreatePreviewRow(
                    pack,
                    assignment,
                    CoverageType.ProviderNeutralBaseline,
                    CoverageSelectionState.AlwaysActive,
                    included,
                    qualityDimension: baseline.Value));

            seenPackIds.Add(pack.PolicyPackId);
        }

        foreach (PolicyPackAssignment assignment in assignments)
        {
            if (!AppliesToScope(assignment, scope))
                continue;

            if (seenPackIds.Contains(assignment.PolicyPackId))
                continue;

            PolicyPack? pack = packs.FirstOrDefault(row => row.PolicyPackId == assignment.PolicyPackId && !row.IsDeleted);

            if (pack is null)
                continue;

            if (!assignment.IsPinned)
                continue;

            bool included = ResolveIncludedInRunEvaluation(
                pack.Name,
                assignment,
                input.FocusedPilotModeEnabled,
                input.CloudProvider);

            rows.Add(
                CreatePreviewRow(
                    pack,
                    assignment,
                    CoverageType.OrganizationRequired,
                    CoverageSelectionState.RequiredAndLocked,
                    included));

            seenPackIds.Add(pack.PolicyPackId);
        }

        if (input.CloudProvider is not CloudProvider.None)
        {
            foreach (PolicyPack pack in packs)
            {
                if (pack.IsDeleted || seenPackIds.Contains(pack.PolicyPackId))
                    continue;

                if (!PlatformOverlayPolicyPacks.IsOverlayDisplayName(pack.Name, input.CloudProvider))
                    continue;

                PolicyPackAssignment? assignment = assignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
                bool overlayEnabled = assignment?.IsEnabled == true
                    || DefaultPolicyPackCatalog.IsStandardBaselineDisplayName(pack.Name, input.CloudProvider);

                if (!overlayEnabled && assignment is null)
                    continue;

                bool included = ResolveIncludedInRunEvaluation(
                    pack.Name,
                    assignment,
                    input.FocusedPilotModeEnabled,
                    input.CloudProvider);

                rows.Add(
                    CreatePreviewRow(
                        pack,
                        assignment,
                        CoverageType.PlatformOverlay,
                        CoverageSelectionState.RecommendedAndSelected,
                        included,
                        recommendationConfidence: RecommendationConfidence.High,
                        trigger: "intake.cloud-target",
                        rationale: $"Cloud target {input.CloudProvider} selects this provider overlay.",
                        evidenceRef: DraftIntakeQuestionKeys.CloudTarget));

                seenPackIds.Add(pack.PolicyPackId);
            }
        }

        foreach (ContextualPolicyPackRecommendation recommendation in ContextualPolicyPackRecommender.Recommend(input))
        {
            if (!packByName.TryGetValue(recommendation.PackDisplayName, out PolicyPack? pack))
                continue;

            if (seenPackIds.Contains(pack.PolicyPackId))
                continue;

            PolicyPackAssignment? assignment = assignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
            CoverageSelectionState selectionState = recommendation.Confidence == RecommendationConfidence.High
                ? CoverageSelectionState.RecommendedAndSelected
                : CoverageSelectionState.OptionalAndNotSelected;

            bool included = selectionState == CoverageSelectionState.RecommendedAndSelected
                && ResolveIncludedInRunEvaluation(
                    pack.Name,
                    assignment,
                    input.FocusedPilotModeEnabled,
                    input.CloudProvider,
                    contextualHighConfidence: true);

            rows.Add(
                CreatePreviewRow(
                    pack,
                    assignment,
                    CoverageType.ContextualRecommended,
                    selectionState,
                    included,
                    recommendationConfidence: recommendation.Confidence,
                    trigger: recommendation.TriggerKey,
                    rationale: recommendation.Rationale,
                    evidenceRef: recommendation.TriggeringEvidenceRef));

            seenPackIds.Add(pack.PolicyPackId);
        }

        if (!input.FocusedPilotModeEnabled)
        {
            foreach (PolicyPackAssignment assignment in assignments)
            {
                if (!AppliesToScope(assignment, scope))
                    continue;

                if (seenPackIds.Contains(assignment.PolicyPackId))
                    continue;

                if (!assignment.IsEnabled)
                    continue;

                PolicyPack? pack = packs.FirstOrDefault(row => row.PolicyPackId == assignment.PolicyPackId && !row.IsDeleted);

                if (pack is null)
                    continue;

                rows.Add(
                    CreatePreviewRow(
                        pack,
                        assignment,
                        CoverageType.AdditionalOptional,
                        CoverageSelectionState.OptionalAndSelected,
                        includedInRunEvaluation: true));

                seenPackIds.Add(assignment.PolicyPackId);
            }
        }

        rows = rows
            .OrderBy(row => row.CoverageType)
            .ThenBy(row => row.PolicyPackDisplayName, StringComparer.Ordinal)
            .ToList();

        int baselineCount = rows.Count(row => row.CoverageType == CoverageType.ProviderNeutralBaseline);
        int orgRequiredCount = rows.Count(row => row.CoverageType == CoverageType.OrganizationRequired);
        int overlayCount = rows.Count(row => row.CoverageType == CoverageType.PlatformOverlay);
        int contextualCount = rows.Count(row => row.CoverageType == CoverageType.ContextualRecommended
            && row.SelectionState == CoverageSelectionState.RecommendedAndSelected);
        int optionalCount = rows.Count(row => row.CoverageType == CoverageType.AdditionalOptional);

        return new CoveragePreviewResult
        {
            FocusedPilotModeEnabled = input.FocusedPilotModeEnabled,
            ProviderNeutralBaselineCount = baselineCount,
            OrganizationRequiredCount = orgRequiredCount,
            PlatformOverlayCount = overlayCount,
            ContextualRecommendedCount = contextualCount,
            AdditionalOptionalCount = optionalCount,
            SummaryLine = BuildSummaryLine(baselineCount, orgRequiredCount, overlayCount, contextualCount, optionalCount),
            Assignments = rows,
        };
    }

    private static CoveragePreviewAssignment CreatePreviewRow(
        PolicyPack pack,
        PolicyPackAssignment? assignment,
        CoverageType coverageType,
        CoverageSelectionState selectionState,
        bool includedInRunEvaluation,
        QualityDimension? qualityDimension = null,
        RecommendationConfidence? recommendationConfidence = null,
        string? trigger = null,
        string? rationale = null,
        string? evidenceRef = null) => new()
    {
        PolicyPackId = pack.PolicyPackId,
        PolicyPackDisplayName = pack.Name,
        PolicyPackVersion = assignment?.PolicyPackVersion ?? pack.CurrentVersion ?? "1.0.0",
        CoverageType = coverageType,
        SelectionState = selectionState,
        RecommendationConfidence = recommendationConfidence,
        RecommendationTrigger = trigger,
        RecommendationRationale = rationale,
        TriggeringEvidenceRef = evidenceRef,
        QualityDimension = qualityDimension ?? pack.QualityDimension,
        IncludedInRunEvaluation = includedInRunEvaluation,
        EvaluationVersion = CoverageEvaluationVersions.PreviewV1,
    };

    private static bool ResolveIncludedInRunEvaluation(
        string packDisplayName,
        PolicyPackAssignment? assignment,
        bool focusedPilotModeEnabled,
        CloudProvider cloudProvider,
        bool contextualHighConfidence = false)
    {
        if (!focusedPilotModeEnabled)
        {
            if (assignment is null)
                return contextualHighConfidence;

            return assignment.IsEnabled;
        }

        bool isPinned = assignment?.IsPinned == true;
        bool isOverlay = PlatformOverlayPolicyPacks.IsOverlayDisplayName(packDisplayName, cloudProvider);

        return FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(packDisplayName, isPinned, isOverlay)
            || contextualHighConfidence;
    }

    private static string BuildSummaryLine(
        int baselineCount,
        int orgRequiredCount,
        int overlayCount,
        int contextualCount,
        int optionalCount)
    {
        List<string> parts = [];

        if (baselineCount > 0)
            parts.Add($"{baselineCount} baseline quality dimension{(baselineCount == 1 ? "" : "s")}");

        if (orgRequiredCount > 0)
            parts.Add($"{orgRequiredCount} organization-required pack{(orgRequiredCount == 1 ? "" : "s")}");

        if (overlayCount > 0)
            parts.Add($"{overlayCount} platform overlay{(overlayCount == 1 ? "" : "s")}");

        if (contextualCount > 0)
            parts.Add($"{contextualCount} project-specific pack{(contextualCount == 1 ? "" : "s")}");

        if (optionalCount > 0)
            parts.Add($"{optionalCount} additional enabled pack{(optionalCount == 1 ? "" : "s")}");

        if (parts.Count == 0)
            return "No assurance coverage could be resolved for this workspace yet.";

        return $"This architecture will use {string.Join(", ", parts)}.";
    }

    private static bool AppliesToScope(PolicyPackAssignment assignment, ScopeContext scope)
    {
        if (assignment.TenantId != scope.TenantId)
            return false;

        return assignment.ScopeLevel switch
        {
            GovernanceScopeLevel.Tenant => true,
            GovernanceScopeLevel.Workspace => assignment.WorkspaceId == scope.WorkspaceId,
            GovernanceScopeLevel.Project => assignment.WorkspaceId == scope.WorkspaceId
                && assignment.ProjectId == scope.ProjectId,
            _ => false,
        };
    }
}
