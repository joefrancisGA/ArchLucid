using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface ISelectiveExecuteIncrementalReReviewCoordinator
{
    Task<IncrementalReReviewResult?> TryRunAfterSelectiveExecuteAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default);
}
