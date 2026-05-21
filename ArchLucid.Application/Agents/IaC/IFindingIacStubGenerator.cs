namespace ArchLucid.Application.Agents.IaC;

public interface IFindingIacStubGenerator
{
    Task GenerateAndPersistStubsForRunAsync(string runId, CancellationToken cancellationToken);
}
