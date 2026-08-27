using ArchLucid.Api.Models;
using ArchLucid.Api.Support;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Api.Services.Authority;

/// <inheritdoc cref="IRunProvenanceQueryService"/>
public sealed class RunProvenanceQueryService(
    IArchitectureRunProvenanceService architectureRunProvenanceService,
    IRunRepository authorityRunRepository,
    IDecisionNodeRepository decisionNodeRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAgentToolInvocationRecordRepository agentToolInvocationRecordRepository,
    IScopeContextProvider scopeContextProvider) : IRunProvenanceQueryService
{
    public async Task<bool> AuthorityRunExistsInScopeAsync(string runId, CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
            return false;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is not null;
    }

    public Task<ArchitectureRunProvenanceGraph?> GetProvenanceAsync(string runId, CancellationToken cancellationToken) =>
        architectureRunProvenanceService.GetProvenanceAsync(runId, cancellationToken);

    public ProvenanceNodeExplanationQueryResult GetProvenanceNodeExplanationNotSupported()
    {
        const string detail =
            "ArchLucid does not provide per-node provenance explanations. "
            + "Use GET /v1/explain/runs/{runId}/aggregate for the supported run-level RunExplanationSummary "
            + "(Standard commercial tier and ReadAuthority scope, same as other routes under /v1/explain). "
            + "Alternatively, GET /v1/explain/runs/{runId}/explain returns the granular ExplanationResult when licensed.";

        IReadOnlyDictionary<string, object?> hints = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["aggregateExplanationPathTemplate"] = "/v1/explain/runs/{runId}/aggregate",
            ["granularExplanationPathTemplate"] = "/v1/explain/runs/{runId}/explain",
        };

        return new ProvenanceNodeExplanationQueryResult { Detail = detail, Hints = hints };
    }

    public async Task<RunDecisionsQueryResult> GetRunDecisionsAsync(string runId, CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
        {
            return new RunDecisionsQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        IReadOnlyList<DecisionNodeRecord> decisions =
            await decisionNodeRepository.GetByRunIdAsync(runId, cancellationToken);

        if (decisions.Count == 0)
        {
            return new RunDecisionsQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail =
                    $"No decisions found for run '{runId}'. Decisions are available after the run has been committed."
            };
        }

        return new RunDecisionsQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = new DecisionNodeResponse { Decisions = decisions.ToList() }
        };
    }

    public async Task<RunEvidenceQueryResult> GetRunEvidenceAsync(string runId, CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
        {
            return new RunEvidenceQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        AgentEvidencePackage? evidence = await agentEvidencePackageRepository.GetByRunIdAsync(
            runId,
            cancellationToken); // codeql[cs/user-controlled-bypass]: tenant-scoped DB; runId authorized via AuthorityRunExistsInScopeAsync above.

        if (evidence is null)
        {
            return new RunEvidenceQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Evidence for run '{runId}' was not found."
            };
        }

        return new RunEvidenceQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = new AgentEvidencePackageResponse { Evidence = evidence }
        };
    }

    public async Task<RunTracesQueryResult> GetRunTracesAsync(
        string runId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        // codeql[cs/user-controlled-bypass]: pagination input validation, not an authorization decision;
        // tenant scoping and run authorization happen separately below.
        if (pageNumber < 1)
        {
            return new RunTracesQueryResult
            {
                Outcome = RunGraphQueryOutcome.BadRequest,
                ProblemDetail = "pageNumber must be at least 1."
            };
        }

        if (pageSize is < 1 or > PagingParameters.MaxPageSize)
        {
            return new RunTracesQueryResult
            {
                Outcome = RunGraphQueryOutcome.BadRequest,
                ProblemDetail = $"pageSize must be between 1 and {PagingParameters.MaxPageSize}."
            };
        }

        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
        {
            return new RunTracesQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        PagingParameters paging = new()
        {
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        (int skip, int take) = paging.Normalize();

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        (IReadOnlyList<AgentExecutionTraceSummary> summaries, int totalCount) =
            await agentExecutionTraceRepository.GetPagedSummariesByRunIdAsync(
                scope,
                runId,
                skip,
                take,
                cancellationToken);

        return new RunTracesQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = new AgentExecutionTraceResponse
            {
                Traces = summaries.ToList(),
                TotalCount = totalCount,
                PageNumber = paging.PageNumber,
                PageSize = paging.PageSize
            }
        };
    }

    public async Task<RunToolInvocationForensicsQueryResult> GetRunToolInvocationForensicsAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
        {
            return new RunToolInvocationForensicsQueryResult
            {
                Outcome = RunGraphQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        IReadOnlyList<AgentExecutionTrace> traces =
            await agentExecutionTraceRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AgentToolInvocationRecord> structured = [];

        if (scope.TenantId != Guid.Empty && Guid.TryParse(runId, out Guid runGuid))
        {
            structured = await agentToolInvocationRecordRepository
                .ListByRunAsync(scope.TenantId, runGuid, cancellationToken)
                .ConfigureAwait(false);
        }

        return new RunToolInvocationForensicsQueryResult
        {
            Outcome = RunGraphQueryOutcome.Success,
            Response = RunToolInvocationForensicsBuilder.Build(runId, traces, structured)
        };
    }
}
