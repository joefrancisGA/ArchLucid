using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Application;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Pilots;

/// <summary>
///     Pilot-facing read models (sponsor summaries, scorecards).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/pilots")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class PilotsController(
    IPilotsApplicationService pilots,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IRunDetailQueryService runDetailQueryService,
    IManifestHashService manifestHashService) : ControllerBase
{
    private readonly IPilotsApplicationService _pilots =
        pilots ?? throw new ArgumentNullException(nameof(pilots));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    [HttpGet("why-archlucid-snapshot")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(WhyArchLucidSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WhyArchLucidSnapshotResponse>> GetWhyArchLucidSnapshot(
        CancellationToken cancellationToken)
    {
        WhyArchLucidSnapshotResponse snapshot = await _pilots.GetWhyArchLucidSnapshotAsync(cancellationToken);

        return Ok(snapshot);
    }

    [HttpGet("sponsor-evidence-pack")]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorEvidencePackResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SponsorEvidencePackResponse>> GetSponsorEvidencePack(
        CancellationToken cancellationToken)
    {
        SponsorEvidencePackResponse pack = await _pilots.GetSponsorEvidencePackAsync(cancellationToken);

        return Ok(pack);
    }
}
