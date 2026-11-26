using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Agents.IaC;

public interface IFindingIacStubGenerator
{
    Task GenerateAndPersistStubsForCommittedRunAsync(
        ScopeContext scope, RunRecord run, CancellationToken cancellationToken);
}
