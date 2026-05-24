using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Review and promote agent-curated evidence proposals.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/evidence")]
public sealed class EvidenceProposalsController(
    IEvidenceProposalQueryService queryService,
    IEvidenceProposalPromoter promoter,
    IAuditService auditService) : ControllerBase
{
    private readonly IEvidenceProposalQueryService _queryService =
        queryService ?? throw new ArgumentNullException(nameof(queryService));

    private readonly IEvidenceProposalPromoter _promoter =
        promoter ?? throw new ArgumentNullException(nameof(promoter));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Lists agent results that contain a proposed evidence JSON payload.</summary>
    [HttpGet("proposals")]
    [ProducesResponseType(typeof(IReadOnlyList<EvidenceProposalListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListProposals(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<EvidenceProposalListItem> rows =
            await _queryService.ListPendingAsync(cancellationToken).ConfigureAwait(false);

        return Ok(rows);
    }

    /// <summary>Promotes a proposal into the tenant curated evidence catalog.</summary>
    [HttpPost("proposals/{resultId}/promote")]
    [ProducesResponseType(typeof(EvidenceProposalPromoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Promote(string resultId, CancellationToken cancellationToken = default)
    {
        try
        {
            Guid entryId = await _promoter.PromoteAsync(resultId, cancellationToken).ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.EvidenceProposalPromoted,
                    DataJson = JsonSerializer.Serialize(new { resultId, catalogEntryId = entryId })
                },
                cancellationToken);

            return Ok(new EvidenceProposalPromoteResponse { CatalogEntryId = entryId });
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }
}

/// <summary>Response body for evidence proposal promotion.</summary>
public sealed class EvidenceProposalPromoteResponse
{
    public Guid CatalogEntryId
    {
        get;
        init;
    }
}
