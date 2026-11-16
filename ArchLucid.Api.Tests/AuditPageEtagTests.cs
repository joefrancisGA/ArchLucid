using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuditPageEtagTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Conditional_request_returns_updated_page_when_continuation_changes(bool search)
    {
        InMemoryAuditRepository repository = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
        AuditController controller = new(
            repository, scopeProvider.Object, new ExportFormatterService(),
            null!, null!, null!, null!, null!, null!, null!, null!);
        DateTime newest = new(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc);
        await repository.AppendAsync(CreateRow(scope, newest), CancellationToken.None);

        DefaultHttpContext firstContext = new();
        controller.ControllerContext = new ControllerContext { HttpContext = firstContext };
        Assert.IsType<OkObjectResult>(await ReadAsync());

        await repository.AppendAsync(CreateRow(scope, newest.AddMinutes(-1)), CancellationToken.None);
        DefaultHttpContext nextContext = new();
        nextContext.Request.Headers.IfNoneMatch = firstContext.Response.Headers.ETag;
        controller.ControllerContext = new ControllerContext { HttpContext = nextContext };

        Assert.IsType<OkObjectResult>(await ReadAsync());
        Assert.NotEqual(firstContext.Response.Headers.ETag.ToString(), nextContext.Response.Headers.ETag.ToString());

        Task<IActionResult> ReadAsync() => search ? controller.SearchAudit(take: 1) : controller.GetAudit(take: 1);
    }

    private static AuditEvent CreateRow(ScopeContext scope, DateTime occurred) => new()
    {
        EventId = Guid.NewGuid(),
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        OccurredUtc = occurred,
        EventType = "Example"
    };
}
