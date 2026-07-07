using System.Security.Claims;

using ArchLucid.Api.Filters;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Authorization;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Filters;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialLimitAuthorizationPipelineTests
{
    [SkippableFact]
    public async Task Authorization_handler_skips_gate_when_endpoint_has_skip_attribute()
    {
        DefaultHttpContext http = BuildHttpContextWithServices(gateThrows: false);
        Endpoint endpoint = new(
            _ => Task.CompletedTask,
            new EndpointMetadataCollection(new SkipTrialWriteLimitAttribute()),
            "skip");
        http.SetEndpoint(endpoint);

        TrialLimitAuthorizationHandler handler = new(new HttpContextAccessor { HttpContext = http });
        TrialActiveRequirement requirement = new();
        AuthorizationHandlerContext authContext = new([requirement], new ClaimsPrincipal(), http);

        await handler.HandleAsync(authContext);

        authContext.HasSucceeded.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Authorization_handler_records_trial_limit_item_when_gate_rejects()
    {
        DefaultHttpContext http = BuildHttpContextWithServices(gateThrows: true);
        TrialLimitAuthorizationHandler handler = new(new HttpContextAccessor { HttpContext = http });
        TrialActiveRequirement requirement = new();
        AuthorizationHandlerContext authContext = new([requirement], new ClaimsPrincipal(), http);

        await handler.HandleAsync(authContext);

        authContext.HasSucceeded.Should().BeFalse();
        http.Items.Should().ContainKey("ArchLucid.TrialLimitExceeded");
    }

    [SkippableFact]
    public async Task Authorization_result_handler_writes_402_when_trial_limit_item_present()
    {
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };
        http.Items["ArchLucid.TrialLimitExceeded"] = new TrialLimitExceededException(TrialLimitReason.Expired, 0);

        TrialLimitAuthorizationResultHandler handler = new();
        RequestDelegate next = _ => Task.CompletedTask;
        AuthorizationPolicy policy = new([], []);
        PolicyAuthorizationResult failed = PolicyAuthorizationResult.Forbid();

        await handler.HandleAsync(next, http, policy, failed);

        http.Response.StatusCode.Should().Be(StatusCodes.Status402PaymentRequired);
    }

    [SkippableFact]
    public async Task Exceeded_audit_filter_logs_when_mvc_action_throws_trial_limit()
    {
        DefaultHttpContext http = BuildHttpContextWithAudit();
        ExceptionContext context = new(
            new ActionContext(http, new RouteData(), new ActionDescriptor()),
            [])
        {
            Exception = new TrialLimitExceededException(TrialLimitReason.RunsExceeded, 1)
        };

        TrialLimitExceededAuditFilter filter = new();

        await filter.OnExceptionAsync(context);

        Mock<ArchLucid.Core.Audit.IAuditService> audit = Mock.Get(
            http.RequestServices.GetRequiredService<ArchLucid.Core.Audit.IAuditService>());

        audit.Verify(
            a => a.LogAsync(It.IsAny<ArchLucid.Core.Audit.AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static DefaultHttpContext BuildHttpContextWithServices(bool gateThrows)
    {
        ServiceCollection services = new();
        Mock<TrialLimitGate> gate = new(MockBehavior.Strict, Mock.Of<ITenantRepository>(), TimeProvider.System);
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);

        if (gateThrows)
        {
            gate.Setup(g => g.GuardWriteAsync(scope, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new TrialLimitExceededException(TrialLimitReason.Expired, 0));
        }
        else
        {
            gate.Setup(g => g.GuardWriteAsync(scope, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        }

        services.AddSingleton(gate.Object);
        services.AddSingleton(scopes.Object);

        DefaultHttpContext http = new();
        http.Request.Method = HttpMethods.Post;
        http.RequestServices = services.BuildServiceProvider();

        return http;
    }

    private static DefaultHttpContext BuildHttpContextWithAudit()
    {
        ServiceCollection services = new();
        Mock<ArchLucid.Core.Audit.IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<ArchLucid.Core.Audit.AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        services.AddSingleton(audit.Object);
        services.AddSingleton(scopes.Object);

        DefaultHttpContext http = new();
        http.RequestServices = services.BuildServiceProvider();

        return http;
    }
}
