using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

public interface IPromptVariantStatsService
{
    Task<PromptVariantStatsResponse> GetStatsAsync(string promptTemplateName, CancellationToken cancellationToken = default);
}
