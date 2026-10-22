using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IPolicyPackDraftService
{
    Task<DraftPolicyPackRuleResponse> DraftRuleAsync(DraftPolicyPackInput input, CancellationToken cancellationToken);
}
