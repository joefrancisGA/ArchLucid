using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Authentication;

using FluentAssertions;

using ITfoxtec.Identity.Saml2.MvcCore.Configuration;
using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2AuthenticationCoexistenceConfigurerTests
{
    [Theory]
    [InlineData("JwtBearer", JwtBearerDefaults.AuthenticationScheme)]
    [InlineData("ApiKey", AuthServiceCollectionExtensions.ApiKeySchemeName)]
    [InlineData("DevelopmentBypass", DevelopmentBypassAuthenticationHandler.SchemeName)]
    public void After_saml_registration_post_configurer_restores_primary_api_defaults(string mode, string expectedPrimaryScheme)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = mode,
            ["ArchLucidAuth:Authority"] = "https://login.example/",
            ["ArchLucidAuth:Audience"] = "api"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        ServiceCollection services = new();
        services.AddLogging();
        services.AddArchLucidAuth(configuration);
        services.AddSaml2(slidingExpiration: true);
        services.AddSingleton<IPostConfigureOptions<AuthenticationOptions>>(
            new ArchLucidSaml2AuthenticationCoexistenceConfigurer(expectedPrimaryScheme));

        ServiceProvider serviceProvider = services.BuildServiceProvider();
        AuthenticationOptions authenticationOptions = serviceProvider.GetRequiredService<IOptions<AuthenticationOptions>>().Value;

        authenticationOptions.DefaultAuthenticateScheme.Should().Be(expectedPrimaryScheme);
        authenticationOptions.DefaultChallengeScheme.Should().Be(expectedPrimaryScheme);
        authenticationOptions.DefaultForbidScheme.Should().Be(expectedPrimaryScheme);
        authenticationOptions.DefaultSignInScheme.Should().Be(Saml2Constants.AuthenticationScheme);
        authenticationOptions.DefaultSignOutScheme.Should().Be(Saml2Constants.AuthenticationScheme);
    }

    [Fact]
    public void Constructor_rejects_empty_primary_scheme()
    {
        Action act = () => _ = new ArchLucidSaml2AuthenticationCoexistenceConfigurer(" ");

        act.Should().Throw<ArgumentException>().WithParameterName("primaryApiAuthenticateScheme");
    }
}
