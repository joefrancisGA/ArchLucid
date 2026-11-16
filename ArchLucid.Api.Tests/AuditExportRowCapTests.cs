using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuditExportRowCapTests
{
    [Theory]
    [InlineData("csv-route")]
    [InlineData("csv")]
    [InlineData("json")]
    [InlineData("cef")]
    public async Task Export_rejects_overflow_before_writing_a_response(string format)
    {
        AuditEvent[] currentRows = [new(), new()];
        Mock<IAuditRepository> repository = new();
        repository.Setup(r => r.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        repository.Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, Guid _, Guid _, AuditEventFilter filter, CancellationToken _) =>
                currentRows.Take(filter.Take + (filter.IncludeExportOverflowRow ? 1 : 0)).ToArray());
        repository.Setup(r => r.StreamFilteredExportAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .Returns(currentRows.Take(1).ToAsyncEnumerable());
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext());
        using MemoryStream body = new();
        DefaultHttpContext context = new();
        context.Response.Body = body;
        AuditController controller = new(
            repository.Object, scope.Object, new ExportFormatterService(),
            null!, null!, null!, null!, null!, null!, null!, null!)
        {
            ControllerContext = new ControllerContext { HttpContext = context }
        };

        DateTime from = new(2026, 11, 15, 0, 0, 0, DateTimeKind.Utc);
        IActionResult result = format == "csv-route"
            ? await controller.ExportAuditCsv(maxRows: 1)
            : await controller.ExportAudit(from, from.AddDays(1), maxRows: 1, format: format);

        ObjectResult conflict = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = Assert.IsType<Microsoft.AspNetCore.Mvc.ProblemDetails>(conflict.Value);
        Assert.Equal(ProblemTypes.AuditExportRowCapExceeded, problem.Type);
        Assert.Equal(0, body.Length);
        repository.Verify(r => r.CountFilteredAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
