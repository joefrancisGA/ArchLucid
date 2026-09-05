using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage.Stages;

/// <inheritdoc cref="ICoveragePreviewEmitStage" />
public sealed class CoveragePreviewEmitStage : ICoveragePreviewEmitStage
{
    public CoveragePreviewResult Emit(ScopeContext scope, CoveragePreviewInput input, CoveragePreviewLoadResult load)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(load);

        List<CoveragePreviewAssignment> rows = [];
        HashSet<Guid> seenPackIds = [];

        foreach (KeyValuePair<string, QualityDimension> baseline in DefaultPolicyPackCatalog.ProviderNeutralBaselineQualityDimensions)
        {
            if (!load.PackByName.TryGetValue(baseline.Key, out PolicyPack? pack))
                continue;

            PolicyPackAssignment? assignment = load.AssignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
            bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                pack,
                assignment,
                input.FocusedPilotModeEnabled,
                input.CloudProvider);

            rows.Add(
                ApplyPreviewOverride(
                    input,
                    pack,
                    CreatePreviewRow(
                        pack,
                        assignment,
                        CoverageType.ProviderNeutralBaseline,
                        CoverageSelectionState.AlwaysActive,
                        included,
                        qualityDimension: baseline.Value)));

            seenPackIds.Add(pack.PolicyPackId);
        }

        foreach (PolicyPackAssignment assignment in load.Assignments)
        {
            if (!AppliesToScope(assignment, scope))
                continue;

            if (seenPackIds.Contains(assignment.PolicyPackId))
                continue;

            PolicyPack? pack = load.Packs.FirstOrDefault(row => row.PolicyPackId == assignment.PolicyPackId && !row.IsDeleted);

            if (pack is null)
                continue;

            if (!PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment))
                continue;

            rows.Add(
                ApplyPreviewOverride(
                    input,
                    pack,
                    CreatePreviewRow(
                        pack,
                        assignment,
                        CoverageType.OrganizationRequired,
                        CoverageSelectionState.RequiredAndLocked,
                        PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                            pack,
                            assignment,
                            input.FocusedPilotModeEnabled,
                            input.CloudProvider))));

            seenPackIds.Add(pack.PolicyPackId);
        }

        if (input.CloudProvider is not CloudProvider.None)
        {
            foreach (PolicyPack pack in load.Packs)
            {
                if (pack.IsDeleted || seenPackIds.Contains(pack.PolicyPackId))
                    continue;

                if (!PlatformOverlayPolicyPacks.IsOverlayPack(pack, input.CloudProvider))
                    continue;

                PolicyPackAssignment? assignment = load.AssignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
                bool overlayEnabled = assignment?.IsEnabled == true
                    || DefaultPolicyPackCatalog.IsStandardBaselineDisplayName(pack.Name, input.CloudProvider);

                if (!overlayEnabled && assignment is null)
                    continue;

                rows.Add(
                    ApplyPreviewOverride(
                        input,
                        pack,
                        CreatePreviewRow(
                            pack,
                            assignment,
                            CoverageType.PlatformOverlay,
                            CoverageSelectionState.RecommendedAndSelected,
                            PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                                pack,
                                assignment,
                                input.FocusedPilotModeEnabled,
                                input.CloudProvider),
                            recommendationConfidence: RecommendationConfidence.High,
                            trigger: "intake.cloud-target",
                            rationale: $"Cloud target {input.CloudProvider} selects this provider overlay.",
                            evidenceRef: DraftIntakeQuestionKeys.CloudTarget)));

                seenPackIds.Add(pack.PolicyPackId);
            }
        }

        foreach (ContextualPolicyPackRecommendation recommendation in ContextualPolicyPackRecommender.Recommend(input))
        {
            if (!load.PackByName.TryGetValue(recommendation.PackDisplayName, out PolicyPack? pack))
                continue;

            if (seenPackIds.Contains(pack.PolicyPackId))
                continue;

            PolicyPackAssignment? assignment = load.AssignmentByPackId.GetValueOrDefault(pack.PolicyPackId);
            CoverageSelectionState selectionState = recommendation.Confidence == RecommendationConfidence.High
                ? CoverageSelectionState.RecommendedAndSelected
                : CoverageSelectionState.OptionalAndNotSelected;

            rows.Add(
                ApplyPreviewOverride(
                    input,
                    pack,
                    CreatePreviewRow(
                        pack,
                        assignment,
                        CoverageType.ContextualRecommended,
                        selectionState,
                        selectionState == CoverageSelectionState.RecommendedAndSelected
                            && PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
                                pack,
                                assignment,
                                input.FocusedPilotModeEnabled,
                                input.CloudProvider),
                        recommendationConfidence: recommendation.Confidence,
                        trigger: recommendation.TriggerKey,
                        rationale: recommendation.Rationale,
                        evidenceRef: recommendation.TriggeringEvidenceRef)));

            seenPackIds.Add(pack.PolicyPackId);
        }

        if (!input.FocusedPilotModeEnabled)
        {
            foreach (PolicyPackAssignment assignment in load.Assignments)
            {
                if (!AppliesToScope(assignment, scope))
                    continue;

                if (seenPackIds.Contains(assignment.PolicyPackId))
                    continue;

                if (!assignment.IsEnabled)
                    continue;

                PolicyPack? pack = load.Packs.FirstOrDefault(row => row.PolicyPackId == assignment.PolicyPackId && !row.IsDeleted);

                if (pack is null)
                    continue;

                rows.Add(
                    ApplyPreviewOverride(
                        input,
                        pack,
                        CreatePreviewRow(
                            pack,
                            assignment,
                            CoverageType.AdditionalOptional,
                            CoverageSelectionState.OptionalAndSelected,
                            includedInRunEvaluation: true)));

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

    private static CoveragePreviewAssignment ApplyPreviewOverride(
        CoveragePreviewInput input,
        PolicyPack pack,
        CoveragePreviewAssignment row)
    {
        if (!RunCoverageOverrideApplicator.TryGetPreviewExclusion(
                pack.PolicyPackId,
                input.UserOverrides,
                out string? exclusionReason))
        {
            return row;
        }

        if (row.CoverageType == CoverageType.OrganizationRequired)
            return row;

        return new CoveragePreviewAssignment
        {
            PolicyPackId = row.PolicyPackId,
            PolicyPackDisplayName = row.PolicyPackDisplayName,
            PolicyPackVersion = row.PolicyPackVersion,
            CoverageType = row.CoverageType,
            SelectionState = CoverageSelectionState.RecommendedButExcluded,
            RecommendationConfidence = row.RecommendationConfidence,
            RecommendationTrigger = row.RecommendationTrigger,
            RecommendationRationale = exclusionReason,
            TriggeringEvidenceRef = row.TriggeringEvidenceRef,
            QualityDimension = row.QualityDimension,
            IncludedInRunEvaluation = false,
            EvaluationVersion = row.EvaluationVersion,
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
