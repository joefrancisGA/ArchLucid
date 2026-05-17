using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthServiceCollectionExtensionsTests
{
    [Fact]
    public void AddArchLucidAuth_with_generic_oidc_authority_configures_jwt_bearer_with_jwks_discovery_and_role_mapping()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Authority"] = "https://generic-oidc.local/",
                ["ArchLucidAuth:Audience"] = "test-api"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();

        services.AddArchLucidAuth(configuration);

        var sp = services.BuildServiceProvider();

        // Verify the JwtBearerOptions configured by the extension
        var optionsMonitor = sp.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        var jwtOptions = optionsMonitor.Get(JwtBearerDefaults.AuthenticationScheme);

        jwtOptions.Authority.Should().Be("https://generic-oidc.local/");
        jwtOptions.Audience.Should().Be("test-api");

        // When Authority is set and no explicit MetadataAddress/ConfigurationManager is provided, 
        // ASP.NET Core JwtBearerHandler will automatically append .well-known/openid-configuration for JWKS discovery.
        
        // Verify Role mapping configuration
        jwtOptions.TokenValidationParameters.RoleClaimType.Should().Be("roles");

        // Verify that ArchLucidRoleClaimsTransformation is registered
        var claimsTransformation = sp.GetRequiredService<IClaimsTransformation>();
        claimsTransformation.Should().BeOfType<ArchLucidRoleClaimsTransformation>();
    }
}
