using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-11 suggestion 109: synthesize commit-time governance assignments from create-time policy pack pins.
/// </summary>
public static class RunHeaderPinnedPolicyPackAssignmentFactory
{
    public static IReadOnlyList<PolicyPackAssignment> BuildSyntheticAssignments(RunRecord header, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson))
            return [];

        if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                header.PinnedPolicyPackIdsJson,
                out PinnedPolicyPackRow[] pinnedRows))
        {
            throw new ConflictException(
                "Commit blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
        }

        List<PolicyPackAssignment> assignments = [];

        foreach (PinnedPolicyPackRow row in pinnedRows)
        {
            if (!Guid.TryParse(row.PolicyPackId, out Guid packId))
            {
                throw new ConflictException(
                    $"Commit blocked: pinned policy pack id '{row.PolicyPackId}' is not a valid GUID.");
            }

            assignments.Add(
                new PolicyPackAssignment
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    PolicyPackId = packId,
                    PolicyPackVersion = row.PolicyPackVersion,
                    IsEnabled = true,
                    IsPinned = true,
                    ScopeLevel = GovernanceScopeLevel.Project,
                });
        }

        return assignments;
    }
}
