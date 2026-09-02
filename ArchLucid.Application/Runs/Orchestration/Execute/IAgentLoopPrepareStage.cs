using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

public interface IAgentLoopPrepareStage
{
    Task<AgentLoopPreparedBatch> PrepareAsync(ArchitectureRun run, string runId, string actor, CancellationToken cancellationToken);
}
