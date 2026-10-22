using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication.Cookies;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Wires <see cref="CookieAuthenticationOptions" /> for the SAML cookie to emit sign-in durable audit.</summary>
internal static class ArchLucidSaml2CookieSignInAuditIntegration
{
    internal static void MergeSignedInHandler(CookieAuthenticationOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.Events ??= new CookieAuthenticationEvents();

        Func<CookieSignedInContext, Task>? prior = options.Events.OnSignedIn;
        options.Events.OnSignedIn = async context =>
        {
            if (prior is not null)
                await prior(context).ConfigureAwait(false);

            await ArchLucidSaml2SignInAudit.AppendCookieSignedInAudit(
                    context,
                    context.HttpContext.RequestAborted)
                .ConfigureAwait(false);
        };
    }
}
