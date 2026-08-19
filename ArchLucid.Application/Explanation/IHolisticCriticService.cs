using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Explanation;

public interface IHolisticCriticService
{
    Task<HolisticCriticResponse> GenerateAsync(
        ScopeContext scope,
        Guid runId,
        HolisticCriticRequest? request,
        CancellationToken cancellationToken);
}
