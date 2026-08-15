using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>
///     Enables cloud-appropriate default policy packs when an architecture run targets AWS or GCP.
/// </summary>
public sealed class DefaultPolicyPackCloudBaselineApplicator(
    IPolicyPackRepository packRepository,
    IPolicyPackAssignmentRepository assignmentRepository,
    ILogger<DefaultPolicyPackCloudBaselineApplicator> logger)
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackAssignmentRepository _assignmentRepository =
        assignmentRepository ?? throw new ArgumentNullException(nameof(assignmentRepository));

    private readonly ILogger<DefaultPolicyPackCloudBaselineApplicator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>Best-effort: toggles assignment enablement to match the run's target cloud provider.</summary>
    public async Task TryApplyAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CloudProvider cloudProvider,
        CancellationToken ct)
    {
        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return;

        IReadOnlySet<string> enabledNames = DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(cloudProvider);
        IReadOnlyList<PolicyPack> packs =
            await _packRepository.ListByScopeAsync(tenantId, workspaceId, projectId, ct);

        IReadOnlyList<PolicyPackAssignment> assignments =
            await _assignmentRepository.ListByScopeAsync(tenantId, workspaceId, projectId, ct);

        foreach (PolicyPack pack in packs)
        {
            if (!string.Equals(pack.PackType, PolicyPackType.PlatformDefault, StringComparison.Ordinal))
                continue;

            PolicyPackAssignment? assignment = FindAssignment(assignments, pack.PolicyPackId);

            if (assignment is null)
                continue;

            bool shouldEnable = enabledNames.Contains(pack.Name);

            if (!shouldEnable || assignment.IsEnabled)
                continue;

            assignment.IsEnabled = true;
            await _assignmentRepository.UpdateAsync(assignment, ct);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Adjusted policy pack assignment {AssignmentId} ({PackName}) IsEnabled={IsEnabled} for CloudProvider={CloudProvider}.",
                    assignment.AssignmentId,
                    pack.Name,
                    shouldEnable,
                    cloudProvider);
            }
        }
    }

    private static PolicyPackAssignment? FindAssignment(
        IReadOnlyList<PolicyPackAssignment> assignments,
        Guid policyPackId)
    {
        foreach (PolicyPackAssignment assignment in assignments)
        {
            if (assignment.PolicyPackId == policyPackId)
                return assignment;
        }

        return null;
    }
}
