namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public sealed class PolicyPackResolver(
    IPolicyPackAssignmentRepository assignmentRepository,
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository) : IPolicyPackResolver
{
    public async Task<EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        var assignments = await assignmentRepository
            .ListByScopeAsync(tenantId, workspaceId, projectId, ct)
            .ConfigureAwait(false);

        var result = new EffectivePolicyPackSet
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        foreach (var assignment in assignments.Where(x => x.IsEnabled))
        {
            var pack = await packRepository.GetByIdAsync(assignment.PolicyPackId, ct).ConfigureAwait(false);
            if (pack is null)
                continue;

            var version = await versionRepository
                .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, ct)
                .ConfigureAwait(false);

            if (version is null)
                continue;

            result.Packs.Add(
                new ResolvedPolicyPack
                {
                    PolicyPackId = pack.PolicyPackId,
                    Name = pack.Name,
                    Version = version.Version,
                    PackType = pack.PackType,
                    ContentJson = version.ContentJson,
                });
        }

        return result;
    }
}
