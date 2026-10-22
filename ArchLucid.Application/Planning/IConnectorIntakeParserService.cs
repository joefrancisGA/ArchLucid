using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IConnectorIntakeParserService
{
    Task<ArchitectureRequest> ParseAsync(ConnectorIntakeRequest input, CancellationToken cancellationToken);
}
