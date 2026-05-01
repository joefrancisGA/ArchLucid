using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Host.Core.Demo;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Demo;

/// <summary>
///     Public, read-only proof endpoint for the operator-shell <c>/demo/explain</c> route.
///     Returns the citations-bound aggregate explanation alongside the full provenance graph for
///     the latest committed demo-seed run, hard-pinned to the demo tenant via
///     <see cref="IDemoReadModelClient" />.
/// </summary>
/// <remarks>
///     <para>
///         <b>Security posture:</b>
///     </para>
///     <list type="bullet">
///         <item>
///             <description>
///                 Hard-blocked from non-<c>Demo:Enabled=true</c> deployments by
///                 <see cref="FeatureGateAttribute" /> — the route returns <c>404</c> on production-like hosts
///                 <em>before</em> any handler runs, so the surface cannot be exposed accidentally.
///             </description>
///         </item>
///         <item>
///             <description>
///                 <see cref="AllowAnonymousAttribute" /> on this controller does <b>not</b> relax authorization
///                 on the underlying <c>/v1/explain</c> or <c>/v1/provenance</c> controllers — the demo client
///                 composes the same application services they use, but only for the demo tenant scope.
///             </description>
///         </item>
///     </list>
/// </remarks>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/demo")]
[EnableRateLimiting("fixed")]
[AllowAnonymous]
[FeatureGate(FeatureGateKey.DemoEnabled)]
public sealed class DemoExplainController(IDemoReadModelClient demoReadModelClient) : ControllerBase
{
    private readonly IDemoReadModelClient _demoReadModelClient =
        demoReadModelClient ?? throw new ArgumentNullException(nameof(demoReadModelClient));

    /// <summary>
    ///     Returns the side-by-side <see cref="DemoExplainResponse.ProvenanceGraph" /> and
    ///     <see cref="DemoExplainResponse.RunExplanation" /> for the latest committed demo-seed run.
    ///     Returns <c>404</c> when the demo seed has not been applied yet (no committed demo run in scope).
    /// </summary>
    [HttpGet("explain")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DemoExplainResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDemoExplain(CancellationToken cancellationToken = default)
    {
        DemoExplainResponse? response =
            await _demoReadModelClient.GetLatestCommittedDemoExplainAsync(cancellationToken);

        if (response is null)
            return this.NotFoundProblem(
                "No committed demo-seed run is available on this host. Run `archlucid try` or POST /v1/demo/seed and retry.",
                ProblemTypes.RunNotFound);

        return Ok(response);
    }
}
