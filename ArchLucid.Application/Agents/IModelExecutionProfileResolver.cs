using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Agents;

public interface IModelExecutionProfileResolver
{
    Task<ModelExecutionProfileResolution> ResolveForRunCreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken);
}
