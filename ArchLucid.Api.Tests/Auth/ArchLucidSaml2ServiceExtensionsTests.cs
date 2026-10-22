using ArchLucid.Api.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2ServiceExtensionsTests
{
    [Fact]
    public void AddArchLucidSaml2IfEnabled_rejects_http_idp_metadata_url()
    {
        ServiceCollection services = new();
        IConfiguration configuration = ConfigurationWithIdpMetadata("http://idp.example/metadata");
        Mock<IWebHostEnvironment> environment = new();

        Action act = () => services.AddArchLucidSaml2IfEnabled(configuration, environment.Object);

        act.Should().Throw<InvalidOperationException>().WithMessage("*HTTPS*");
    }

    [Fact]
    public void AddArchLucidSaml2IfEnabled_rejects_idp_metadata_that_is_not_an_absolute_url()
    {
        ServiceCollection services = new();
        IConfiguration configuration = ConfigurationWithIdpMetadata("idp.example/metadata");
        Mock<IWebHostEnvironment> environment = new();

        Action act = () => services.AddArchLucidSaml2IfEnabled(configuration, environment.Object);

        act.Should().Throw<InvalidOperationException>().WithMessage("*HTTPS*");
    }

    [Fact]
    public void AddArchLucidSaml2IfEnabled_accepts_absolute_https_idp_metadata_url()
    {
        ServiceCollection services = new();
        IConfiguration configuration = ConfigurationWithIdpMetadata("https://idp.example/metadata");
        Mock<IWebHostEnvironment> environment = new();

        Action act = () => services.AddArchLucidSaml2IfEnabled(configuration, environment.Object);

        act.Should().NotThrow();
    }

    private static IConfiguration ConfigurationWithIdpMetadata(string idpMetadata)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Saml2:Enabled"] = "true",
            ["ArchLucidAuth:Saml2:SigningCertificateFile"] = "certs/sp.pfx",
            ["ArchLucidAuth:Saml2:IdPMetadata"] = idpMetadata,
            ["ArchLucidAuth:Mode"] = "JwtBearer",
        };

        return new ConfigurationBuilder().AddInMemoryCollection(data).Build();
    }
}
