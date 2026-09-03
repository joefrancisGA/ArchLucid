using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

public interface IPolicyPackPublishStage
{
    Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct);
}
