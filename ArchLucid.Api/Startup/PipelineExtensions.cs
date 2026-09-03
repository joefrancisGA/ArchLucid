using ArchLucid.Api.Auth;
using ArchLucid.Api.Middleware;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Middleware;

using ITfoxtec.Identity.Saml2.MvcCore.Configuration;

namespace ArchLucid.Api.Startup;

internal static partial class PipelineExtensions
{
    /// <summary>Authentication, authorization, metering, health maps, and controllers (endpoint execution).</summary>
    public static WebApplication UseArchLucidPipelineAfterSerilogRequestLogging(this WebApplication app)
    {
        if (ArchLucidSaml2HostFlags.IsSaml2Enabled(app.Configuration))
            app.UseSaml2();

        app.UseAuthentication();
        app.UseMiddleware<ScopeIdentityBindingMiddleware>();
        app.UseMiddleware<ScopeResolutionGuardMiddleware>();
        app.UseRateLimiter();
        app.UseMiddleware<ArchLucidRateLimitTelemetryHeadersMiddleware>();
        app.UseMiddleware<TenantErasureQuarantineMiddleware>();
        app.UseMiddleware<TrialSeatReservationMiddleware>();
        app.UseAuthorization();
        app.UseMiddleware<EmptyErrorResponseNormalizationMiddleware>();
        app.UseMiddleware<LlmTokenUsageResponseMiddleware>();
        app.UseMiddleware<ApiRequestMeteringMiddleware>();
        app.MapArchLucidHealthAndDocEndpoints();

        bool prometheusEnabled = app.Configuration.GetValue("Observability:Prometheus:Enabled", false);

        if (prometheusEnabled)
        {
            app.UseMiddleware<PrometheusScrapeAuthMiddleware>();
            app.UseOpenTelemetryPrometheusScrapingEndpoint();
        }

        app.MapControllers();
        return app;
    }
}
