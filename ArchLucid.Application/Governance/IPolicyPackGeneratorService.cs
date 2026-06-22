using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IPolicyPackGeneratorService
{
    Task<GeneratePolicyPackResponse> GenerateAsync(
        GeneratePolicyPackRequest input,
        CancellationToken cancellationToken);
}
