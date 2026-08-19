using ArchLucid.Contracts.Requests;

using JetBrains.Annotations;

namespace ArchLucid.AgentSimulator.Scenarios;

public interface IScenarioProvider
{
    [UsedImplicitly]
    bool CanHandle(ArchitectureRequest request);
}
