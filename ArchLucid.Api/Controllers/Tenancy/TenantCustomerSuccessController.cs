using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Customer health scores and PMF feedback for the active tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/customer-success")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantCustomerSuccessController(
    ITenantCustomerSuccessRepository customerSuccessRepository,
    IOperatorNextBestActionService nextBestActionService,
    IOperatorStickinessSnapshotReader stickinessSnapshotReader,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly ITenantCustomerSuccessRepository _customerSuccessRepository =
        customerSuccessRepository ?? throw new ArgumentNullException(nameof(customerSuccessRepository));

    private readonly IOperatorNextBestActionService _nextBestActionService =
        nextBestActionService ?? throw new ArgumentNullException(nameof(nextBestActionService));

    private readonly IOperatorStickinessSnapshotReader _stickinessSnapshotReader =
        stickinessSnapshotReader ?? throw new ArgumentNullException(nameof(stickinessSnapshotReader));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Returns the latest materialized health score row when the worker has populated it.</summary>
    [HttpGet("health-score")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantHealthScoreResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHealthScoreAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantHealthScoreRecord? row = await _customerSuccessRepository.GetHealthScoreAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken)
            .ConfigureAwait(false);

        if (row is null)
        {
            return Ok(
                new TenantHealthScoreResponse { IsCalculated = false });
        }

        return Ok(
            new TenantHealthScoreResponse
            {
                IsCalculated = true,
                EngagementScore = row.EngagementScore,
                BreadthScore = row.BreadthScore,
                QualityScore = row.QualityScore,
                GovernanceScore = row.GovernanceScore,
                SupportScore = row.SupportScore,
                CompositeScore = row.CompositeScore,
                UpdatedUtc = row.UpdatedUtc
            });
    }

    /// <summary>Top next actions for the active scope (sticky operator home guidance).</summary>
    [HttpGet("next-actions")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<OperatorNextBestActionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextBestActionsAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<OperatorNextBestActionItem> items =
            await _nextBestActionService.GetActionsAsync(cancellationToken).ConfigureAwait(false);

        OperatorNextBestActionResponse[] body = items
            .Select(static i => new OperatorNextBestActionResponse
            {
                ActionId = i.ActionId,
                Title = i.Title,
                Reason = i.Reason,
                Href = i.Href
            })
            .ToArray();

        return Ok(body);
    }

    /// <summary>
    ///     Queryable pilot funnel milestones derived from durable SQL (runs, manifests, audit, product-learning) —
    ///     no PII payload.
    /// </summary>
    [HttpGet("funnel-snapshot")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(PilotFunnelSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFunnelSnapshotAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PilotFunnelSnapshot snap = await _stickinessSnapshotReader
            .GetFunnelSnapshotAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        return Ok(
            new PilotFunnelSnapshotResponse
            {
                FirstRunCreatedUtc = ToOffset(snap.FirstRunCreatedUtc),
                FirstGoldenManifestUtc = ToOffset(snap.FirstGoldenManifestUtc),
                FirstComparisonUtc = ToOffset(snap.FirstComparisonUtc),
                FirstArtifactOrBundleDownloadUtc = ToOffset(snap.FirstArtifactOrBundleDownloadUtc),
                FirstReplayUtc = ToOffset(snap.FirstReplayUtc),
                TotalRunsInScope = snap.TotalRunsInScope,
                CommittedRunsInScope = snap.CommittedRunsInScope,
                ProductLearningSignalsLast90Days = snap.ProductLearningSignalsLast90Days
            });
    }

    private static DateTimeOffset? ToOffset(DateTime? utc)
    {
        if (utc is null)
            return null;

        return new DateTimeOffset(DateTime.SpecifyKind(utc.Value, DateTimeKind.Utc), TimeSpan.Zero);
    }

    /// <summary>Records thumbs feedback for product instrumentation.</summary>
    [HttpPost("product-feedback")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> PostProductFeedbackAsync(
        [FromBody] ProductFeedbackRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ProductFeedbackSubmission submission = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingRef = request.FindingRef,
            RunId = request.RunId,
            Score = request.Score,
            Comment = request.Comment
        };

        await _customerSuccessRepository.InsertProductFeedbackAsync(submission, cancellationToken)
            .ConfigureAwait(false);

        return NoContent();
    }
}
