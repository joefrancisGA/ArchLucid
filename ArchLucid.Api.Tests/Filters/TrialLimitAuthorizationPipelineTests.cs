using System.Globalization;
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
    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static readonly TimeProvider FixedTime =
        new FixedUtcTimeProvider(new DateTime(2026, 4, 17, 12, 0, 0, DateTimeKind.Utc));

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
        AuthorizationPolicy policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new TrialActiveRequirement())
            .Build();
        PolicyAuthorizationResult failed = PolicyAuthorizationResult.Forbid();

        await handler.HandleAsync(next, http, policy, failed);

        http.Response.StatusCode.Should().Be(StatusCodes.Status402PaymentRequired);
    }

    [SkippableFact]
    public async Task Authorization_result_handler_writes_401_problem_json_when_unauthenticated()
    {
        DefaultHttpContext http = new() { Response = { Body = new MemoryStream() } };

        TrialLimitAuthorizationResultHandler handler = new();
        RequestDelegate next = _ => Task.CompletedTask;
        AuthorizationPolicy policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new TrialActiveRequirement())
            .Build();
        PolicyAuthorizationResult failed = PolicyAuthorizationResult.Challenge();

        await handler.HandleAsync(next, http, policy, failed);

        http.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        http.Response.ContentType.Should().StartWith("application/problem+json");
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
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> tenants = new();
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);

        if (gateThrows)
        {
            tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new TenantRecord
                    {
                        Id = tenantId,
                        Name = "n",
                        Slug = "s",
                        Tier = TenantTier.Standard,
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                        TrialStatus = TrialLifecycleStatus.Active,
                        TrialExpiresUtc = DateTimeOffset.Parse("2026-04-10T00:00:00Z", CultureInfo.InvariantCulture),
                        TrialRunsLimit = 10,
                        TrialRunsUsed = 0,
                    });
        }
        else
        {
            tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new TenantRecord
                    {
                        Id = tenantId,
                        Name = "n",
                        Slug = "s",
                        Tier = TenantTier.Standard,
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                        TrialStatus = TrialLifecycleStatus.Active,
                        TrialExpiresUtc = TimeProvider.System.GetUtcNow().AddDays(7),
                        TrialRunsLimit = 10,
                        TrialRunsUsed = 3,
                        TrialSeatsLimit = 5,
                        TrialSeatsUsed = 2,
                    });
        }

        services.AddSingleton<ITenantRepository>(tenants.Object);
        services.AddSingleton(new TrialLimitGate(tenants.Object, FixedTime));
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
