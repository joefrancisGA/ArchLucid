using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Development-only endpoints for deterministic trusted-baseline demo data (Corrected 50R / 49R pass 2).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/demo")]
[EnableRateLimiting("expensive")]
public sealed class DemoController(
    IDemoSeedService demoSeedService,
    IOptions<DemoOptions> demoOptions,
    IWebHostEnvironment environment) : ControllerBase
{
    /// <summary>Runs the Contoso Retail Modernization demo seed. No-op for missing rows; safe to repeat.</summary>
    /// <remarks>
    ///     Available when <c>Demo:Enabled</c> is true and either the host environment is Development OR
    ///     <c>Demo:SaaSGuestSeedEnabled</c> is true (V1 Operator Shell — OS-1, LATEST.md improvement #1).
    /// </remarks>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SeedAsync(CancellationToken cancellationToken = default)
    {
        // OS-1 guard: Development hosts always allow seeding; non-Dev hosts require Demo:SaaSGuestSeedEnabled
        // (production-hosted SaaS tenants opt in via appsettings.SaaS.json). Demo:Enabled remains the master switch.
        bool isDevOrSaaSEnabled = environment.IsDevelopment() || demoOptions.Value.SaaSGuestSeedEnabled;

        if (!isDevOrSaaSEnabled)
            return this.NotFoundProblem(
                "Demo seed is available only in Development environment.",
                ProblemTypes.ResourceNotFound);

        if (!demoOptions.Value.Enabled)
            return this.BadRequestProblem(
                "Demo seeding is disabled. Set Demo:Enabled to true in configuration.",
                ProblemTypes.BadRequest);

        await demoSeedService.SeedAsync(cancellationToken);
        return NoContent();
    }
}
