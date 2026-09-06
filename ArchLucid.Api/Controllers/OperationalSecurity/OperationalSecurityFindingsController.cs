using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/findings")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityFindingsController(
    IOperationalSecurityFindingIngestService ingestService,
    IOperationalSecurityFindingRepository repository,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("ingest")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: OperationalSecurityFindingIngestService logs Ingested/Deduplicated via IAuditService.")]
    [ProducesResponseType(typeof(OperationalSecurityFindingBatchIngestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Ingest(
        [FromBody] OperationalSecurityFindingIngestRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.Items.Count == 0)
        {
            return this.BadRequestProblem(
                "At least one finding item is required.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        IReadOnlyList<OperationalSecurityFindingIngestItem> items = request.Items
            .Select(MapIngestItem)
            .ToList();

        OperationalSecurityFindingBatchIngestResult result = await ingestService.IngestBatchAsync(
            scope,
            items,
            actorId,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OperationalSecurityFindingRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<OperationalSecurityFindingRecord> findings = await repository.ListByTenantAsync(
            scope.TenantId,
            status,
            cancellationToken);

        return Ok(findings);
    }

    [HttpGet("{findingId:guid}")]
    [ProducesResponseType(typeof(OperationalSecurityFindingDetailResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetail(
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        if (findingId == Guid.Empty)
        {
            return this.BadRequestProblem("FindingId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        OperationalSecurityFindingDetailResult result = await ingestService.TryGetDetailAsync(
            scope,
            findingId,
            cancellationToken);

        if (!result.Succeeded || result.Finding is null)
        {
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Operational security finding was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result);
    }

    private static OperationalSecurityFindingIngestItem MapIngestItem(
        OperationalSecurityFindingIngestRequestItem request) =>
        new()
        {
            Provider = request.Provider,
            SourceSystem = request.SourceSystem,
            SourceFindingId = request.SourceFindingId,
            CloudResourceId = request.CloudResourceId,
            ExternalResourceId = request.ExternalResourceId,
            ResourceType = request.ResourceType,
            SubscriptionOrAccountId = request.SubscriptionOrAccountId,
            ControlId = request.ControlId,
            ControlFramework = request.ControlFramework,
            Title = request.Title,
            Description = request.Description,
            Severity = request.Severity,
            RiskScore = request.RiskScore,
            Exploitability = request.Exploitability,
            Exposure = request.Exposure,
            BusinessCriticality = request.BusinessCriticality,
            BlastRadius = request.BlastRadius,
            ObservedUtc = request.ObservedUtc,
            Status = request.Status,
            RawEvidenceReference = request.RawEvidenceReference,
            AssessmentId = request.AssessmentId,
            InventoryDiffId = request.InventoryDiffId,
            AuditEvidenceSnapshotId = request.AuditEvidenceSnapshotId,
            Metadata = request.Metadata,
        };
}
