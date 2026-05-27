namespace ArchLucid.Application.Governance;

/// <summary>Builds TB-061 decision-needed digest sections from live governance data.</summary>
public interface IGovernanceDigestDecisionNeededComposer
{
    Task<string?> BuildDecisionNeededMarkdownAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default);
}
