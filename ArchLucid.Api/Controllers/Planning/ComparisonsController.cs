using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ApiReplayComparisonRequest = ArchLucid.Api.Models.ReplayComparisonRequest;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP API for managing architectural run comparison records, drift analysis, and comparison replay.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ComparisonsController(
    IComparisonsApplicationService comparisons,
    IComparisonReplayApiService comparisonReplayApiService,
    IValidator<ComparisonHistoryQuery> comparisonHistoryQueryValidator,
    IValidator<ApiReplayComparisonRequest> replayComparisonRequestValidator,
    IValidator<BatchReplayComparisonRequest> batchReplayComparisonRequestValidator)
    : ControllerBase
{
    private readonly IComparisonsApplicationService _comparisons =
        comparisons ?? throw new ArgumentNullException(nameof(comparisons));

    private readonly IComparisonReplayApiService _comparisonReplayApiService =
        comparisonReplayApiService ?? throw new ArgumentNullException(nameof(comparisonReplayApiService));

    private readonly IValidator<ComparisonHistoryQuery> _comparisonHistoryQueryValidator =
        comparisonHistoryQueryValidator ?? throw new ArgumentNullException(nameof(comparisonHistoryQueryValidator));

    private readonly IValidator<ApiReplayComparisonRequest> _replayComparisonRequestValidator =
        replayComparisonRequestValidator ?? throw new ArgumentNullException(nameof(replayComparisonRequestValidator));

    private readonly IValidator<BatchReplayComparisonRequest> _batchReplayComparisonRequestValidator =
        batchReplayComparisonRequestValidator
        ?? throw new ArgumentNullException(nameof(batchReplayComparisonRequestValidator));
}
