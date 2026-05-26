using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Read-only quality gate configuration for operator diagnostics.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/diagnostics")]
[EnableRateLimiting("fixed")]
public sealed class AdminQualityGateDiagnosticsController(
    IOptionsMonitor<AgentOutputQualityGateOptions> qualityGateOptions) : ControllerBase
{
    private readonly IOptionsMonitor<AgentOutputQualityGateOptions> _qualityGateOptions =
        qualityGateOptions ?? throw new ArgumentNullException(nameof(qualityGateOptions));

    /// <summary>Returns active structural/semantic reject floors and PilotStrict minimums.</summary>
    [HttpGet("quality-gates")]
    [ProducesResponseType(typeof(AdminQualityGateDiagnosticsResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminQualityGateDiagnosticsResponse> GetQualityGates()
    {
        AgentOutputQualityGateOptions options = _qualityGateOptions.CurrentValue;

        AdminQualityGateDiagnosticsResponse body = new()
        {
            Enabled = options.Enabled,
            Mode = options.Mode.ToString(),
            StructuralWarnBelow = options.StructuralWarnBelow,
            StructuralRejectBelow = options.StructuralRejectBelow,
            SemanticWarnBelow = options.SemanticWarnBelow,
            SemanticRejectBelow = options.SemanticRejectBelow,
            PilotStrictMinStructuralCompleteness = options.PilotStrictMinStructuralCompleteness,
            PilotStrictMinSemanticScore = options.PilotStrictMinSemanticScore,
            PilotStrictMinEvidenceRefCount = options.PilotStrictMinEvidenceRefCount,
            PilotStrictMinFaithfulnessSupportRatio = options.PilotStrictMinFaithfulnessSupportRatio,
            PilotStrictMinAgentResultFaithfulnessSupportRatio =
                options.PilotStrictMinAgentResultFaithfulnessSupportRatio,
            EnforceOnReject = options.EnforceOnReject,
            BlockRunOnReject = options.BlockRunOnReject,
        };

        return Ok(body);
    }
}
