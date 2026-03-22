namespace ArchiForge.Decisioning.Governance.Resolution;

public interface IEffectiveGovernanceResolver
{
    Task<EffectiveGovernanceResolutionResult> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
