using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

public sealed class PlatformUserAuthVersionJwtBearerPostConfigure(IServiceProvider serviceProvider) : IPostConfigureOptions<JwtBearerOptions>
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    public void PostConfigure(string? name, JwtBearerOptions options)
    {
        JwtBearerEvents existingEvents = options.Events ?? new JwtBearerEvents();
        Func<TokenValidatedContext, Task> prior = existingEvents.OnTokenValidated ?? (_ => Task.CompletedTask);

        existingEvents.OnTokenValidated = async context =>
        {
            await prior(context).ConfigureAwait(false);

            if (context.Principal is null)
            {
                return;
            }

            string? issuer = context.Principal.FindFirst(JwtRegisteredClaimNames.Iss)?.Value
                ?? (context.SecurityToken is JwtSecurityToken jwt ? jwt.Issuer : null);

            string? subject = context.Principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            string? authVersion = context.Principal.FindFirst(PlatformIdentityClaimTypes.AuthVersion)?.Value;

            await using AsyncServiceScope scope = _serviceProvider.CreateAsyncScope();
            PlatformUserAuthVersionValidator validator =
                scope.ServiceProvider.GetRequiredService<PlatformUserAuthVersionValidator>();

            bool valid = await validator.ValidateAsync(
                issuer,
                subject,
                authVersion,
                context.HttpContext.RequestAborted).ConfigureAwait(false);

            if (!valid)
            {
                context.Fail("The access token is no longer valid. Sign in again.");
            }
        };

        options.Events = existingEvents;
    }
}
