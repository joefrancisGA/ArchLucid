using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Query.Stages;

public sealed class RunFindingsInspectStage(
    IRunRepository authorityRunRepository,
    IFindingInspectReadRepository findingInspectReadRepository,
    IFindingTrustLabelMapper findingTrustLabelMapper,
    IReasoningSummaryBuilder reasoningSummaryBuilder,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService) : IRunFindingsInspectStage
{
    public async Task<FindingInspectQueryResult> GetFindingInspectForRunAsync(
        string runId,
        string findingId,
        bool includeTypedPayload,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Run id is required."
            };
        }

        if (string.IsNullOrWhiteSpace(findingId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Finding id is required."
            };
        }

        if (findingId.Trim().Length > 64)
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Finding id exceeds maximum length (64)."
            };
        }

        RunFindingsQueryOutcome? lifecycleBlock = await RunFindingsLifecycleGuard.TryBlockWhenLifecycleIncompleteAsync(
            runId,
            authorityRunRepository,
            scopeContextProvider,
            cancellationToken);

        if (lifecycleBlock is not null)
        {
            return new FindingInspectQueryResult
            {
                Outcome = lifecycleBlock.Value,
                ProblemDetail = lifecycleBlock.Value == RunFindingsQueryOutcome.Conflict
                    ? $"Finding inspect blocked for run '{runId}': authority lifecycle must be Complete."
                    : $"Run '{runId}' was not found."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        FindingInspectReadOptions options = includeTypedPayload
            ? FindingInspectReadOptions.Full
            : FindingInspectReadOptions.MetadataOnly;

        FindingInspectResponse? body =
            await findingInspectReadRepository.GetInspectAsync(scope, findingId.Trim(), cancellationToken, options);

        if (body is null)
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Finding '{findingId.Trim()}' was not found in the current scope."
            };
        }

        if (!AuthorityRunIdentifier.Matches(runId.Trim(), body.RunId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Finding '{findingId.Trim()}' was not found for run '{runId.Trim()}'."
            };
        }

        try
        {
            await FindingInspectPinnedEvidenceGuard.EnsureInspectEvidenceInventoryBoundOrThrowAsync(
                body,
                scope,
                authorityQueryService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.Conflict,
                ProblemDetail = ex.Message
            };
        }

        return new FindingInspectQueryResult
        {
            Outcome = RunFindingsQueryOutcome.Success,
            Response = FindingInspectTrustLabelEnricher.Enrich(
                body.WithReasoningSummaryFromBuilder(reasoningSummaryBuilder),
                findingTrustLabelMapper)
        };
    }
}
