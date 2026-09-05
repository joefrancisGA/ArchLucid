using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.Resolution;

public sealed partial class EffectiveGovernanceResolver
{
    private async Task<(List<EffectiveGovernanceFacetMerger.ResolvedPackRow> ResolvedPacks, List<string> SkippedNotes)>
        LoadResolvedPacksAsync(
            List<PolicyPackAssignment> applicable,
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            CancellationToken ct)
    {
        List<EffectiveGovernanceFacetMerger.ResolvedPackRow> resolvedPacks = [];
        List<string> skippedNotes = [];

        bool focusedPilotMode = Core.Governance.PolicyPacks.PilotModeGovernanceScope.IsActive;

        if (focusedPilotMode)
            skippedNotes.Add(GovernanceConstants.Notes.FocusedPilotModeActive);

        // Cache deserialized content per (packId, version) — the same version may appear
        // across multiple scope-level assignments and deserializing the same JSON repeatedly
        // is pure waste.
        Dictionary<(Guid PackId, string Version), PolicyPackContentDocument> contentCache = [];

        IReadOnlyList<PolicyPack> loadedPacks = applicable.Count == 0
            ? Array.Empty<PolicyPack>()
            : await packRepository.GetByIdsAsync(
                applicable.Select(static assignment => assignment.PolicyPackId).Distinct().ToList(),
                ct);

        Dictionary<Guid, PolicyPack> packById = loadedPacks
            .Where(pack => ArchLucid.Core.Governance.PolicyPacks.PolicyPackVisibility.IsVisibleInScope(
                pack,
                tenantId,
                workspaceId,
                projectId))
            .ToDictionary(static pack => pack.PolicyPackId);

        foreach (PolicyPackAssignment assignment in applicable)
        {
            if (!packById.TryGetValue(assignment.PolicyPackId, out PolicyPack? pack))
            {
                skippedNotes.Add(
                    string.Format(
                        GovernanceConstants.Notes.SkippedPackNotFound,
                        assignment.PolicyPackId));
                continue;
            }

            if (focusedPilotMode && !Core.Governance.PolicyPacks.FocusedPilotModePolicyPacks.IsPackAllowedInFocusedReview(
                    pack.Name,
                    Core.Governance.PolicyPacks.PolicyPackAssignmentOrganizationRequired.IsOrganizationRequired(assignment),
                    Core.Governance.PolicyPacks.PlatformOverlayPolicyPacks.IsOverlayDisplayName(
                        pack.Name,
                        Core.Governance.PolicyPacks.PilotModeGovernanceScope.ActiveCloudProvider)))
            {
                skippedNotes.Add(
                    string.Format(
                        GovernanceConstants.Notes.SkippedFocusedPilotPack,
                        pack.Name,
                        assignment.PolicyPackId));
                continue;
            }

            if (!await platformAvailability.IsGloballyActiveAsync(pack, ct))
            {
                skippedNotes.Add(
                    string.Format(
                        GovernanceConstants.Notes.SkippedPackGloballyInactive,
                        pack.Name,
                        assignment.PolicyPackId));
                continue;
            }

            PolicyPackVersion? version = await versionRepository
                    .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, ct)
                ;

            if (version is null)
            {
                skippedNotes.Add(
                    string.Format(
                        GovernanceConstants.Notes.SkippedVersionNotFound,
                        pack.Name,
                        assignment.PolicyPackId,
                        assignment.PolicyPackVersion));
                continue;
            }

            (Guid, string) cacheKey = (assignment.PolicyPackId, assignment.PolicyPackVersion);

            if (!contentCache.TryGetValue(cacheKey, out PolicyPackContentDocument? content))
            {
                try
                {
                    content = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                        version.ContentJson,
                        PolicyPackJsonSerializerOptions.Default);
                }
                catch (JsonException ex)
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedCorruptJson,
                            pack.Name,
                            assignment.PolicyPackId,
                            assignment.PolicyPackVersion,
                            ex.Message));
                    continue;
                }

                if (content is null)
                {
                    skippedNotes.Add(
                        string.Format(
                            GovernanceConstants.Notes.SkippedNullContent,
                            pack.Name,
                            assignment.PolicyPackId,
                            assignment.PolicyPackVersion));
                    continue;
                }

                contentCache[cacheKey] = content;
                ArchLucidInstrumentation.GovernancePackContentDeserializeCacheMisses.Add(1);
            }
            else

                ArchLucidInstrumentation.GovernancePackContentDeserializeCacheHits.Add(1);

            resolvedPacks.Add(new EffectiveGovernanceFacetMerger.ResolvedPackRow(assignment, pack, version, content));
        }

        return (resolvedPacks, skippedNotes);
    }
}
