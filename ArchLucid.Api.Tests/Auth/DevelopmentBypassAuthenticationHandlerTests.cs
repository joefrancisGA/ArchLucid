using System.Security.Claims;
using System.Text.Encodings.Web;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DevelopmentBypassAuthenticationHandlerTests
{
    [SkippableFact]
    public async Task Authenticate_emits_default_scope_claims_when_dev_scope_not_configured()
    {
        DevelopmentBypassAuthHandlerTestDouble handler = CreateHandler(new ArchLucidAuthOptions());

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.FindFirst("tenant_id")?.Value.Should().Be(ScopeIds.DefaultTenant.ToString("D"));
        result.Principal?.FindFirst("workspace_id")?.Value.Should().Be(ScopeIds.DefaultWorkspace.ToString("D"));
        result.Principal?.FindFirst("project_id")?.Value.Should().Be(ScopeIds.DefaultProject.ToString("D"));
    }

    [SkippableFact]
    public async Task Authenticate_emits_configured_dev_scope_claims()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        DevelopmentBypassAuthHandlerTestDouble handler = CreateHandler(new ArchLucidAuthOptions
        {
            DevTenantId = tenantId,
            DevWorkspaceId = workspaceId,
            DevProjectId = projectId
        });

        AuthenticateResult result = await handler.InvokeHandleAuthenticateAsync();

        result.Succeeded.Should().BeTrue();
        result.Principal?.FindFirst("tenant_id")?.Value.Should().Be(tenantId.ToString("D"));
        result.Principal?.FindFirst("workspace_id")?.Value.Should().Be(workspaceId.ToString("D"));
        result.Principal?.FindFirst("project_id")?.Value.Should().Be(projectId.ToString("D"));
    }

    private static DevelopmentBypassAuthHandlerTestDouble CreateHandler(ArchLucidAuthOptions authOptions)
    {
        Mock<IOptionsMonitor<AuthenticationSchemeOptions>> monitor = new();
        AuthenticationSchemeOptions schemeOptions = new();
        monitor.Setup(m => m.CurrentValue).Returns(schemeOptions);
        monitor.Setup(m => m.Get(It.IsAny<string>())).Returns(schemeOptions);

        Mock<IOptions<ArchLucidAuthOptions>> options = new();
        options.Setup(o => o.Value).Returns(authOptions);

        Mock<IHostEnvironment> environment = new();
        environment.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        DevelopmentBypassAuthHandlerTestDouble handler = new(
            monitor.Object,
            NullLoggerFactory.Instance,
            UrlEncoder.Default,
            options.Object,
            environment.Object);

        DefaultHttpContext http = new();
        AuthenticationScheme scheme = new(
            DevelopmentBypassAuthenticationHandler.SchemeName,
            "DevelopmentBypass",
            typeof(DevelopmentBypassAuthenticationHandler));

        handler.InitializeAsync(scheme, http).GetAwaiter().GetResult();
        return handler;
    }

    private sealed class DevelopmentBypassAuthHandlerTestDouble(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory loggerFactory,
        UrlEncoder encoder,
        IOptions<ArchLucidAuthOptions> authOptions,
        IHostEnvironment hostEnvironment)
        : DevelopmentBypassAuthenticationHandler(options, loggerFactory, encoder, authOptions, hostEnvironment)
    {
        public Task<AuthenticateResult> InvokeHandleAuthenticateAsync()
        {
            return HandleAuthenticateAsync();
        }
    }
}
