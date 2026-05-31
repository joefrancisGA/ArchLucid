using System.Security.Claims;
using System.Text.Encodings.Web;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Authentication;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;
[Trait("Category", "Unit")]

/// <summary>
///     Unit tests for <see cref="ApiKeyAuthenticationHandler" /> (handler is non-sealed to allow this test double).
/// </summary>
public sealed class ApiKeyAuthenticationHandlerTests
{
    [SkippableFact]
    public async Task When_enabled_false_and_bypass_false_returns_failure()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "false"
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task When_enabled_true_and_valid_admin_key_returns_success_with_admin_role()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "secret-admin");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "secret-admin"
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.FindFirst(ClaimTypes.Name)?.Value.Should().Be("ApiKeyAdmin");
        result.Principal?.IsInRole(ArchLucidRoles.Admin).Should().BeTrue();
    }

    [SkippableFact]
    public async Task When_scope_ids_configured_emits_tenant_workspace_and_project_claims()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "secret-admin");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "secret-admin",
                ["Authentication:ApiKey:TenantId"] = tenantId.ToString("D"),
                ["Authentication:ApiKey:WorkspaceId"] = workspaceId.ToString("D"),
                ["Authentication:ApiKey:ProjectId"] = projectId.ToString("D")
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.FindFirst("tenant_id")?.Value.Should().Be(tenantId.ToString("D"));
        result.Principal?.FindFirst("workspace_id")?.Value.Should().Be(workspaceId.ToString("D"));
        result.Principal?.FindFirst("project_id")?.Value.Should().Be(projectId.ToString("D"));
    }

    [SkippableFact]
    public async Task When_enabled_true_and_comma_separated_admin_keys_either_segment_authenticates()
    {
        DefaultHttpContext httpFirst = new();
        httpFirst.Request.Headers.Append("X-Api-Key", "new-admin");
        DefaultHttpContext httpSecond = new();
        httpSecond.Request.Headers.Append("X-Api-Key", "old-admin");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        IReadOnlyDictionary<string, string?> cfg = new Dictionary<string, string?>
        {
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "new-admin, old-admin"
        };

        AuthenticateResult first = await CreateHandler(cfg, httpFirst, env).InvokeHandleAuthenticateAsync();
        AuthenticateResult second = await CreateHandler(cfg, httpSecond, env).InvokeHandleAuthenticateAsync();

        first.Succeeded.Should().BeTrue();
        second.Succeeded.Should().BeTrue();
    }

    [SkippableFact]
    public async Task When_enabled_true_and_comma_separated_admin_keys_with_empty_segment_ignores_blanks()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "only-key");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "  only-key  , , "
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    [SkippableFact]
    public async Task When_enabled_true_and_invalid_key_returns_failure()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "wrong");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "good-key"
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("Invalid");
    }

    [SkippableFact]
    public async Task When_enabled_false_and_bypass_true_in_development_returns_success_without_header()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true"
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.Identity?.Name.Should().Be("DevUser");
        result.Principal?.IsInRole(ArchLucidRoles.Admin).Should().BeTrue();
    }

    [SkippableFact]
    public async Task When_enabled_false_and_bypass_true_in_production_returns_failure()
    {
        DefaultHttpContext http = new();
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Production);
        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "false",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true"
            },
            http,
            env);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("Production");
    }

    /// <summary>
    ///     Simulates configuration reload: first request sees key A, subsequent
    ///     <see cref="IOptionsMonitor{TOptions}.CurrentValue" /> sees key B.
    /// </summary>
    [SkippableFact]
    public async Task When_api_key_options_monitor_advances_old_material_fails_and_new_succeeds()
    {
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);
        ApiKeyAuthenticationOptions first = new()
        {
            Enabled = true,
            AdminKey = "rotate-a"
        };
        ApiKeyAuthenticationOptions second = new()
        {
            Enabled = true,
            AdminKey = "rotate-b"
        };
        int pass = 0;
        Mock<IOptionsMonitor<ApiKeyAuthenticationOptions>> apiKeyMonitor = new();
        apiKeyMonitor.Setup(m => m.CurrentValue).Returns(() => Interlocked.Increment(ref pass) == 1 ? first : second);

        DefaultHttpContext httpOkOld = new();
        httpOkOld.Request.Headers.Append("X-Api-Key", "rotate-a");
        ApiKeyAuthHandlerTestDouble h1 = CreateHandlerWithApiKeyMonitor(apiKeyMonitor.Object, httpOkOld, env);
        (await h1.InvokeHandleAuthenticateAsync()).Succeeded.Should().BeTrue();

        DefaultHttpContext httpFailOld = new();
        httpFailOld.Request.Headers.Append("X-Api-Key", "rotate-a");
        ApiKeyAuthHandlerTestDouble h2 = CreateHandlerWithApiKeyMonitor(apiKeyMonitor.Object, httpFailOld, env);
        (await h2.InvokeHandleAuthenticateAsync()).Succeeded.Should().BeFalse();

        DefaultHttpContext httpOkNew = new();
        httpOkNew.Request.Headers.Append("X-Api-Key", "rotate-b");
        ApiKeyAuthHandlerTestDouble h3 = CreateHandlerWithApiKeyMonitor(apiKeyMonitor.Object, httpOkNew, env);
        (await h3.InvokeHandleAuthenticateAsync()).Succeeded.Should().BeTrue();
    }

    [SkippableFact]
    public async Task When_admin_key_is_expired_returns_failure_with_expiry_message()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "admin-key");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);

        // Set time past the expiry date.
        Mock<TimeProvider> frozenTime = new();
        frozenTime.Setup(t => t.GetUtcNow())
            .Returns(new DateTimeOffset(2026, 1, 2, 0, 0, 0, TimeSpan.Zero));

        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "admin-key",
                ["Authentication:ApiKey:AdminKeyExpiresAt"] = "2026-01-01T00:00:00Z"
            },
            http,
            env,
            frozenTime.Object);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeFalse();
        result.Failure?.Message.Should().Contain("expired");
    }

    [SkippableFact]
    public async Task When_admin_key_expiry_is_in_future_returns_success()
    {
        DefaultHttpContext http = new();
        http.Request.Headers.Append("X-Api-Key", "admin-key");
        IHostEnvironment env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == Environments.Development);

        // Set time before the expiry date.
        Mock<TimeProvider> frozenTime = new();
        frozenTime.Setup(t => t.GetUtcNow())
            .Returns(new DateTimeOffset(2025, 12, 31, 0, 0, 0, TimeSpan.Zero));

        ApiKeyAuthHandlerTestDouble handler = CreateHandler(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "admin-key",
                ["Authentication:ApiKey:AdminKeyExpiresAt"] = "2026-01-01T00:00:00Z"
            },
            http,
            env,
            frozenTime.Object);

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
    }

    private static ApiKeyAuthHandlerTestDouble CreateHandler(
        IReadOnlyDictionary<string, string?> configData,
        HttpContext httpContext,
        IHostEnvironment environment,
        TimeProvider? timeProvider = null)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();
        ServiceCollection services = [];
        services.AddOptions();
        services.Configure<ApiKeyAuthenticationOptions>(
            configuration.GetSection(ApiKeyAuthenticationOptions.SectionPath));
        using ServiceProvider sp = services.BuildServiceProvider();
        IOptionsMonitor<ApiKeyAuthenticationOptions> apiKeyMonitor =
            sp.GetRequiredService<IOptionsMonitor<ApiKeyAuthenticationOptions>>();

        return CreateHandlerWithApiKeyMonitor(apiKeyMonitor, httpContext, environment, timeProvider);
    }

    private static ApiKeyAuthHandlerTestDouble CreateHandlerWithApiKeyMonitor(
        IOptionsMonitor<ApiKeyAuthenticationOptions> apiKeyMonitor,
        HttpContext httpContext,
        IHostEnvironment environment,
        TimeProvider? timeProvider = null)
    {
        Mock<IOptionsMonitor<AuthenticationSchemeOptions>> monitor = new();
        AuthenticationSchemeOptions schemeOptions = new();
        monitor.Setup(m => m.CurrentValue).Returns(schemeOptions);
        monitor.Setup(m => m.Get(It.IsAny<string>())).Returns(schemeOptions);

        ApiKeyAuthHandlerTestDouble handler = new(
            monitor.Object,
            NullLoggerFactory.Instance,
            UrlEncoder.Default,
            apiKeyMonitor,
            environment,
            timeProvider ?? TimeProvider.System);

        AuthenticationScheme scheme = new(
            AuthServiceCollectionExtensions.ApiKeySchemeName,
            "API Key",
            typeof(ApiKeyAuthenticationHandler));

        handler.InitializeAsync(scheme, httpContext).GetAwaiter().GetResult();
        return handler;
    }

    private sealed class ApiKeyAuthHandlerTestDouble(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory loggerFactory,
        UrlEncoder encoder,
        IOptionsMonitor<ApiKeyAuthenticationOptions> apiKeyOptions,
        IHostEnvironment environment,
        TimeProvider timeProvider)
        : ApiKeyAuthenticationHandler(options, loggerFactory, encoder, apiKeyOptions, environment, timeProvider)
    {
        public Task<AuthenticateResult> InvokeHandleAuthenticateAsync()
        {
            return HandleAuthenticateAsync();
        }
    }
}
