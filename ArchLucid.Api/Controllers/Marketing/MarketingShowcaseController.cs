using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Persistence.Caching;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Marketing;

using ArchLucid.Api.Security;

[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/marketing/showcase")]
[EnableRateLimiting("fixed")]
public sealed class MarketingShowcaseController(
    IPublicShowcaseCommitPageClient showcaseClient,
    IHotPathReadCache hotPathReadCache,
    IOptionsMonitor<DemoOptions> demoOptions) : ControllerBase
{
    private static string ShowcaseBundleCacheKey(Guid runId) =>
        FormattableString.Invariant($"marketing-showcase:bundle:v1:{runId:D}");

    private readonly IPublicShowcaseCommitPageClient _showcaseClient =
        showcaseClient ?? throw new ArgumentNullException(nameof(showcaseClient));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IOptionsMonitor<DemoOptions> _demoOptions =
        demoOptions ?? throw new ArgumentNullException(nameof(demoOptions));

    [HttpGet("{runKey}")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, NoStore = false)]
    [OutputCache(PolicyName = "Showcase")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DemoCommitPagePreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetShowcase(string runKey, CancellationToken cancellationToken = default)
    {
        if (!TryResolveRunId(runKey, out Guid runId))
            return this.NotFoundProblem(
                "The showcase run key is not recognized.",
                ProblemTypes.ResourceNotFound);

        int ttlSeconds = ClampShowcaseCacheSeconds(_demoOptions.CurrentValue);
        DemoCommitPagePreviewResponse? payload = await _hotPathReadCache.GetOrCreateAsync(
            ShowcaseBundleCacheKey(runId),
            ct => _showcaseClient.GetShowcaseCommitPageAsync(runId, ct),
            cancellationToken,
            ttlSeconds);

        return payload is null
            ? this.NotFoundProblem("The showcase was not found.", ProblemTypes.ResourceNotFound)
            : Ok(payload);
    }

    private static int ClampShowcaseCacheSeconds(DemoOptions options)
    {
        int seconds = options.PreviewCacheSeconds;

        if (seconds < 1)
            seconds = 300;

        return Math.Clamp(seconds, 30, 3600);
    }

    private static bool TryResolveRunId(string runKey, out Guid runId)
    {
        runId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runKey))
            return false;

        string trimmed = runKey.Trim();

        if (Guid.TryParse(trimmed, out runId))
            return true;

        string lowered = trimmed.ToLowerInvariant();

        if (lowered is "contoso-baseline" or "contoso-retail-baseline" or "retail-baseline")
        {
            runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;

            return true;
        }

        if (lowered is not ("contoso-hardened" or "contoso-retail-hardened" or "retail-hardened"))
            return trimmed.Length == 32 && IsHex32(trimmed) && Guid.TryParseExact(trimmed, "N", out runId);
        runId = ContosoRetailDemoIdentifiers.AuthorityRunHardenedId;

        return true;
    }

    private static bool IsHex32(string value)
    {
        return value.All(Uri.IsHexDigit);
    }
}
