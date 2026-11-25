using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Middleware;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiRequestMeteringIdentityTests
{
    [Fact]
    public async Task Shared_incoming_correlation_counts_two_requests_but_replaying_events_does_not()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject
        };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(p => p.GetCurrentScope()).Returns(scope);
        Mock<IOptionsMonitor<MeteringOptions>> options = new();
        options.Setup(p => p.CurrentValue).Returns(new MeteringOptions { Enabled = true });
        List<UsageEvent> events = [];
        Mock<IApiRequestUsageEventBuffer> buffer = new();
        buffer.Setup(b => b.Enqueue(It.IsAny<UsageEvent>())).Callback<UsageEvent>(events.Add);
        ApiRequestMeteringMiddleware metering = new(
            scopes.Object, buffer.Object, options.Object, NullLogger<ApiRequestMeteringMiddleware>.Instance);
        CorrelationIdMiddleware correlation = new(
            context => metering.InvokeAsync(context, _ => Task.CompletedTask), scopes.Object);

        const string sharedCorrelationId = "shared-correlation";
        DefaultHttpContext first = new() { TraceIdentifier = "server-request-1", Request = { Path = "/v1/runs" } };
        DefaultHttpContext second = new() { TraceIdentifier = "server-request-2", Request = { Path = "/v1/runs" } };
        first.Request.Headers[CorrelationIdHeaderParser.HeaderName] = sharedCorrelationId;
        second.Request.Headers[CorrelationIdHeaderParser.HeaderName] = sharedCorrelationId;

        await correlation.InvokeAsync(first);
        await correlation.InvokeAsync(second);

        first.TraceIdentifier.Should().Be(sharedCorrelationId);
        second.TraceIdentifier.Should().Be(sharedCorrelationId);
        first.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(sharedCorrelationId);
        second.Response.Headers[CorrelationIdHeaderParser.HeaderName].ToString().Should().Be(sharedCorrelationId);
        events.Should().HaveCount(2);
        events.Should().OnlyContain(e => e.CorrelationId == sharedCorrelationId
            && e.TenantId == scope.TenantId && e.Kind == UsageMeterKind.ApiRequest && e.Quantity == 1);
        events[0].Id.Should().NotBe(Guid.Empty).And.NotBe(events[1].Id);
        events[1].Id.Should().NotBe(Guid.Empty);

        InMemoryUsageEventRepository repository = new();
        await repository.InsertBatchAsync([events[0], events[1], events[0]], CancellationToken.None);
        await repository.InsertBatchAsync(events, CancellationToken.None);
        await repository.InsertAsync(events[0], CancellationToken.None);

        DateTimeOffset periodStart = events.Min(e => e.RecordedUtc).AddHours(-1);
        DateTimeOffset periodEnd = events.Max(e => e.RecordedUtc).AddHours(1);
        IReadOnlyList<UsageEvent> rows = await repository.ListAsync(
            scope.TenantId, periodStart, periodEnd, UsageMeterKind.ApiRequest, 10, CancellationToken.None);
        rows.Should().HaveCount(2);
        events[0].IdempotencyKey.Should().NotBe(events[1].IdempotencyKey);
        events[0].IdempotencyKey.Should().Be($"api-event:{events[0].Id:N}");
        events[1].IdempotencyKey.Should().Be($"api-event:{events[1].Id:N}");
        rows.Select(e => e.Id).Should().BeEquivalentTo(events.Select(e => e.Id));
        IReadOnlyList<TenantUsageSummary> totals = await repository.AggregateByKindAsync(
            scope.TenantId, periodStart, periodEnd, CancellationToken.None);
        totals.Should().ContainSingle(e => e.Kind == UsageMeterKind.ApiRequest && e.TotalQuantity == 2);
    }
}
