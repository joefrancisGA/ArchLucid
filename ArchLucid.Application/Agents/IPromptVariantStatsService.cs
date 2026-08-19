using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Agents;

public interface IPromptVariantStatsService
{
    Task<PromptVariantStatsResponse> GetStatsAsync(string promptTemplateName, CancellationToken cancellationToken = default);
}
