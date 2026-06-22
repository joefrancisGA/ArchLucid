using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IChatIntakeParserService
{
    Task<ArchitectureRequest> ParseAsync(ChatIntakeRequest input, CancellationToken cancellationToken);
}
