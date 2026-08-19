using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WebhookDeliveryConfigurationRulesTests
{
    [Fact]
    public void CollectErrors_when_in_production_and_webhook_uses_http_client_but_no_secret_returns_error()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WebhookDelivery:UseHttpClient"] = "true",
                ["WebhookDelivery:HmacSha256SharedSecret"] = ""
            })
            .Build();

        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Production");

        var errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("WebhookDelivery:HmacSha256SharedSecret is required in Production when WebhookDelivery:UseHttpClient is true"));
    }
    
    [Fact]
    public void CollectErrors_when_in_production_and_webhook_uses_http_client_and_secret_too_short_returns_error()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WebhookDelivery:UseHttpClient"] = "true",
                ["WebhookDelivery:HmacSha256SharedSecret"] = "too-short" // under 32 chars
            })
            .Build();

        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Production");

        var errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("must be at least 32 characters in Production when WebhookDelivery:UseHttpClient is true"));
    }

    [Fact]
    public void CollectErrors_when_in_production_and_webhook_uses_http_client_with_valid_secret_does_not_return_error()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["ConnectionStrings:ArchLucid"] = "Server=...",
                ["Cors:AllowedOrigins:0"] = "https://example.com",
                ["ArchLucidAuth:Authority"] = "https://example.com",
                ["WebhookDelivery:UseHttpClient"] = "true",
                ["WebhookDelivery:HmacSha256SharedSecret"] = "this-is-a-valid-secret-that-is-at-least-32-characters"
            })
            .Build();

        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Production");

        var errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("WebhookDelivery:HmacSha256SharedSecret"));
    }
}
