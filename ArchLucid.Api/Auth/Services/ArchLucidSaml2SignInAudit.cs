using System.Globalization;
using System.Security.Claims;
using System.Text.Json.Serialization;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Core.Audit;

using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Durable audit hooks for ITfoxtec SAML 2.0 SP cookie sign-in (success on cookie issued; failure on protocol errors).</summary>
internal static class ArchLucidSaml2SignInAudit
{
    internal const string ItfoxtecSamlNamespace = "ITfoxtec.Identity.Saml2";

    internal static bool IsItfoxtecSamlProtocolException(Exception exception)
    {
        if (exception is null)
            return false;

        string? ns = exception.GetType().Namespace;

        return string.Equals(ns, ItfoxtecSamlNamespace, StringComparison.Ordinal);
    }

    internal static bool IsSamlAuthRoute(PathString path) =>
        path.StartsWithSegments("/Auth", StringComparison.OrdinalIgnoreCase);

    [InformationalAudit]
    internal static async Task TryAppendProtocolFailureAudit(HttpContext httpContext, Exception exception,
        CancellationToken cancellationToken)
    {
        if (httpContext is null || exception is null)
            return;

        try
        {
            if (!ArchLucidSaml2HostFlags.IsSaml2Enabled(httpContext.RequestServices.GetRequiredService<IConfiguration>()))
                return;

            if (!IsItfoxtecSamlProtocolException(exception))
                return;

            if (!IsSamlAuthRoute(httpContext.Request.Path))
                return;

            IServiceScopeFactory scopeFactory = httpContext.RequestServices.GetRequiredService<IServiceScopeFactory>();

            using IServiceScope scope = scopeFactory.CreateScope();
            IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

            Saml2SignInFailedPayload payload = new(
                Scheme: Saml2Constants.AuthenticationScheme,
                ExceptionType: exception.GetType().Name,
                Path: httpContext.Request.Path.Value ?? string.Empty);

            AuditEvent auditEvent = new()
            {
                EventType = AuditEventTypes.Saml2ServiceProviderSignInFailed,
                ExplicitActor = true,
                ActorUserId = "saml2:sign-in-failed",
                ActorUserName = "Saml2SignIn",
                DataJson = System.Text.Json.JsonSerializer.Serialize(payload),
                CorrelationId = httpContext.TraceIdentifier
            };

            await auditService.LogAsync(auditEvent, cancellationToken).ConfigureAwait(false);
        }
        catch
        {
            // Best-effort: never mask the original fault path.
        }
    }

    [InformationalAudit]
    internal static async Task AppendCookieSignedInAudit(
        CookieSignedInContext context,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        HttpContext httpContext = context.HttpContext;
        ClaimsPrincipal principal = context.Principal
            ?? throw new InvalidOperationException("CookieSignedInContext.Principal is required for SAML sign-in audit.");

        IServiceScopeFactory scopeFactory = httpContext.RequestServices.GetRequiredService<IServiceScopeFactory>();

        using IServiceScope scope = scopeFactory.CreateScope();
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

        if (principal.Identity is ClaimsIdentity claimsIdentity)
        {
            IOptions<ArchLucidSamlAuthOptions> samlOptions =
                scope.ServiceProvider.GetRequiredService<IOptions<ArchLucidSamlAuthOptions>>();

            ArchLucidSamlInboundClaimsNormalizer.Apply(claimsIdentity, samlOptions.Value);
        }

        string? nameId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        string nameIdPrefix = nameId is { Length: > 0 }
            ? nameId[..Math.Min(8, nameId.Length)]
            : string.Empty;

        (bool hasTenantClaim, Guid tenantIdWhenPresent) = TryGetAuditTenantId(principal);

        Saml2SignInSucceededPayload payload = new(
            Scheme: Saml2Constants.AuthenticationScheme,
            NameIdPrefix: nameIdPrefix,
            HasTenantIdClaim: hasTenantClaim,
            TenantIdClaimParsed: tenantIdWhenPresent);

        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.Saml2ServiceProviderSignInSucceeded,
            ExplicitActor = true,
            ActorUserId = string.IsNullOrEmpty(nameIdPrefix) ? "saml2:nameid:unknown" : $"saml2:nameid:{nameIdPrefix}",
            ActorUserName = principal.Identity?.Name ?? "unknown",
            TenantId = tenantIdWhenPresent,
            DataJson = System.Text.Json.JsonSerializer.Serialize(payload),
            CorrelationId = httpContext.TraceIdentifier
        };

        await auditService.LogAsync(auditEvent, cancellationToken).ConfigureAwait(false);
    }

    private sealed record Saml2SignInSucceededPayload(
        [property: JsonPropertyName("scheme")] string Scheme,
        [property: JsonPropertyName("nameIdPrefix")] string NameIdPrefix,
        [property: JsonPropertyName("hasTenantIdClaim")] bool HasTenantIdClaim,
        [property: JsonPropertyName("tenantIdClaim")] Guid TenantIdClaimParsed);

    private static (bool HasTenantIdClaim, Guid TenantIdWhenPresent) TryGetAuditTenantId(ClaimsPrincipal principal)
    {
        List<Guid> parsed = [];

        foreach (Claim claim in principal.FindAll("tenant_id"))
        {
            if (string.IsNullOrWhiteSpace(claim.Value))
                continue;

            if (Guid.TryParse(claim.Value, CultureInfo.InvariantCulture, out Guid tenantId))
                parsed.Add(tenantId);
        }

        bool hasAnyTenantClaim = principal.FindAll("tenant_id").Any(static c => !string.IsNullOrWhiteSpace(c.Value));

        if (parsed.Count == 0)
            return (hasAnyTenantClaim, Guid.Empty);

        List<Guid> distinct = parsed.Distinct().ToList();

        if (distinct.Count != 1)
            return (hasAnyTenantClaim, Guid.Empty);

        return (true, distinct[0]);
    }

    private sealed record Saml2SignInFailedPayload(
        [property: JsonPropertyName("scheme")] string Scheme,
        [property: JsonPropertyName("exceptionType")] string ExceptionType,
        [property: JsonPropertyName("path")] string Path);
}
