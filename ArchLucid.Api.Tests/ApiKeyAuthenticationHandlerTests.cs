using ArchLucid.Api.Authentication;
using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

using Moq;

using System.Security.Claims;
using System.Text.Encodings.Web;

namespace ArchLucid.Api.Tests;

/// <summary>
/// Unit tests for <see cref="ApiKeyAuthenticationHandler"/> (handler is non-sealed to allow this test double).
/// </summary>
public sealed class ApiKeyAuthenticationHandlerTests
{
    [Fact]
    public async Task When_enabled_false_and_bypass_false_returns_failure()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure.Should().NotBeNull();
    }

    [Fact]
    public async Task When_enabled_true_and_valid_admin_key_returns_success_with_admin_role()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "secret-admin");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "secret-admin",
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.FindFirst(ClaimTypes.Name)?.Value.Should().Be("ApiKeyAdmin");
        result.Principal?.IsInRole(ArchLucidRoles.Admin).Should().BeTrue();
    }

    [Fact]
    public async Task When_enabled_true_and_invalid_key_returns_failure()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "wrong");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "good-key",
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("Invalid");
    }

    [Fact]
    public async Task When_enabled_false_and_bypass_true_in_development_returns_success_without_header()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.Identity?.Name.Should().Be("DevUser");
        result.Principal?.IsInRole(ArchLucidRoles.Admin).Should().BeTrue();
    }

    [Fact]
    public async Task When_enabled_false_and_bypass_true_in_production_returns_failure()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Production);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("Production");
    }

    private static ApiKeyAuthHandlerTestDouble CreateHandler(
        IReadOnlyDictionary<string, string?> configData,
        HttpContext httpContext,
        IHostEnvironment environment)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();
        Mock<IOptionsMonitor<AuthenticationSchemeOptions>> monitor = new();
        AuthenticationSchemeOptions schemeOptions = new();
        monitor.Setup(m => m.CurrentValue).Returns(schemeOptions);
        monitor.Setup(m => m.Get(It.IsAny<string>())).Returns(schemeOptions);

        ApiKeyAuthHandlerTestDouble handler = new(
            monitor.Object,
            NullLoggerFactory.Instance,
            UrlEncoder.Default,
            configuration,
            environment);

        AuthenticationScheme scheme = new(
            AuthServiceCollectionExtensions.ApiKeySchemeName,
            "API Key",
            typeof(ApiKeyAuthenticationHandler));

        handler.InitializeAsync(scheme, httpContext).GetAwaiter().GetResult();
        return handler;
    }

    private sealed class ApiKeyAuthHandlerTestDouble : ApiKeyAuthenticationHandler
    {
        public ApiKeyAuthHandlerTestDouble(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory loggerFactory,
            UrlEncoder encoder,
            IConfiguration configuration,
            IHostEnvironment environment)
            : base(options, loggerFactory, encoder, configuration, environment)
        {
        }

        public Task<AuthenticateResult> InvokeHandleAuthenticateAsync() => HandleAuthenticateAsync();
    }
}
