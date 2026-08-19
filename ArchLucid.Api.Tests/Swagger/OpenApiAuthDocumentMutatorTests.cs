using ArchLucid.Api.Swagger;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.Swagger;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OpenApiAuthDocumentMutatorTests
{
    [SkippableFact]
    public void Apply_adds_bearer_scheme_when_jwt_mode_configured()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Audience"] = "api://archlucid-test",
                ["ArchLucidAuth:Authority"] = "https://login.example.test/tenant/v2.0"
            }).Build();

        OpenApiDocument document = new();

        OpenApiAuthDocumentMutator.Apply(document, configuration);

        document.Components.Should().NotBeNull();
        document.Components!.SecuritySchemes.Should().ContainKey(SwaggerOpenApiAuth.BearerSchemeId);
        document.Security.Should().NotBeNullOrEmpty();
    }

    [SkippableFact]
    public void Apply_noop_when_development_bypass_mode()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "DevelopmentBypass" }).Build();

        OpenApiDocument document = new();

        OpenApiAuthDocumentMutator.Apply(document, configuration);

        document.Components.Should().BeNull();
        document.Security.Should().BeNull();
    }
}
