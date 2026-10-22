using ArchLucid.Api.Controllers.ValueReports;
using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.ValueReports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ValueReportControllerUnitTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GenerateAsync_returns_bad_request_when_to_is_not_after_from()
    {
        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 120,
            jobQueue: Mock.Of<IValueReportJobQueue>(),
            renderer: Mock.Of<IValueReportRenderer>());

        DateTimeOffset end = DateTimeOffset.Parse("2026-06-01T00:00:00Z");
        DateTimeOffset start = end.AddDays(1);

        IActionResult action = await controller.GenerateAsync(
            tenantId: null,
            from: start,
            to: end,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GenerateAsync_returns_accepted_when_window_exceeds_async_threshold()
    {
        Guid jobId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IValueReportJobQueue> jobQueue = new();
        jobQueue
            .Setup(q => q.Enqueue(It.IsAny<ValueReportJobRequest>()))
            .Returns(jobId);

        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 1,
            jobQueue: jobQueue.Object,
            renderer: Mock.Of<IValueReportRenderer>());

        DateTimeOffset end = DateTimeOffset.Parse("2026-06-30T00:00:00Z");
        DateTimeOffset start = end.AddDays(-30);

        IActionResult action = await controller.GenerateAsync(
            tenantId: null,
            from: start,
            to: end,
            CancellationToken.None);

        AcceptedResult accepted = action.Should().BeOfType<AcceptedResult>().Subject;
        accepted.Value.Should().NotBeNull();

        jobQueue.Verify(q => q.Enqueue(It.IsAny<ValueReportJobRequest>()), Times.Once);
    }

    [Fact]
    public async Task GenerateAsync_returns_docx_file_for_small_window()
    {
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        Mock<IValueReportRenderer> renderer = new();
        renderer
            .Setup(r => r.RenderAsync(It.IsAny<ValueReportSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(docxBytes);

        Mock<IAuditService> audit = new();

        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 120,
            jobQueue: Mock.Of<IValueReportJobQueue>(),
            renderer: renderer.Object,
            audit: audit.Object);

        DateTimeOffset end = DateTimeOffset.Parse("2026-06-30T00:00:00Z");
        DateTimeOffset start = end.AddDays(-7);

        IActionResult action = await controller.GenerateAsync(
            tenantId: null,
            from: start,
            to: end,
            CancellationToken.None);

        FileContentResult file = action.Should().BeOfType<FileContentResult>().Subject;
        file.ContentType.Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        file.FileContents.Should().BeEquivalentTo(docxBytes);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ValueReportGenerated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void GetJobDocx_returns_not_found_when_job_missing()
    {
        Mock<IValueReportJobQueue> jobQueue = new();
        jobQueue
            .Setup(q => q.TryPoll(It.IsAny<Guid>(), Scope.TenantId))
            .Returns(new ValueReportJobPollResult(false, false, null, null, null));

        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 120,
            jobQueue: jobQueue.Object,
            renderer: Mock.Of<IValueReportRenderer>());

        IActionResult action = controller.GetJobDocx(Guid.NewGuid());

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void GetJobDocx_returns_file_when_job_completed()
    {
        Guid jobId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        Mock<IValueReportJobQueue> jobQueue = new();
        jobQueue
            .Setup(q => q.TryPoll(jobId, Scope.TenantId))
            .Returns(new ValueReportJobPollResult(true, true, docxBytes, "report.docx", null));

        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 120,
            jobQueue: jobQueue.Object,
            renderer: Mock.Of<IValueReportRenderer>());

        IActionResult action = controller.GetJobDocx(jobId);

        FileContentResult file = action.Should().BeOfType<FileContentResult>().Subject;
        file.FileDownloadName.Should().Be("report.docx");
    }

    [Fact]
    public void GetJobDocx_returns_accepted_when_job_pending()
    {
        Guid jobId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IValueReportJobQueue> jobQueue = new();
        jobQueue
            .Setup(q => q.TryPoll(jobId, Scope.TenantId))
            .Returns(new ValueReportJobPollResult(true, false, null, "pending.docx", null));

        ValueReportController controller = CreateController(
            asyncJobThresholdDays: 120,
            jobQueue: jobQueue.Object,
            renderer: Mock.Of<IValueReportRenderer>());

        IActionResult action = controller.GetJobDocx(jobId);

        StatusCodeResult accepted = action.Should().BeOfType<StatusCodeResult>().Subject;
        accepted.StatusCode.Should().Be(StatusCodes.Status202Accepted);
        controller.Response.Headers.RetryAfter.ToString().Should().Be("2");
    }

    private static ValueReportController CreateController(
        int asyncJobThresholdDays,
        IValueReportJobQueue jobQueue,
        IValueReportRenderer renderer,
        IAuditService? audit = null)
    {
        Mock<IOptionsMonitor<ValueReportComputationOptions>> optionsMonitor = new();
        optionsMonitor
            .Setup(o => o.CurrentValue)
            .Returns(new ValueReportComputationOptions { AsyncJobWhenWindowDaysExceeds = asyncJobThresholdDays });

        ValueReportBuilder builder = new(new StubValueReportMetricsReader(), optionsMonitor.Object);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        DefaultHttpContext httpContext = new();
        httpContext.Request.PathBase = new PathString("/api");

        return new ValueReportController(
                builder,
                renderer,
                jobQueue,
                scopeProvider.Object,
                audit ?? Mock.Of<IAuditService>(),
                optionsMonitor.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };
    }

    private sealed class StubValueReportMetricsReader : IValueReportMetricsReader
    {
        public Task<ValueReportRawMetrics> ReadAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            DateTimeOffset fromUtcInclusive,
            DateTimeOffset toUtcExclusive,
            CancellationToken cancellationToken)
        {
            _ = tenantId;
            _ = workspaceId;
            _ = projectId;
            _ = fromUtcInclusive;
            _ = toUtcExclusive;
            _ = cancellationToken;

            ValueReportRawMetrics raw = new(
                [new ValueReportRunStatusCount("Completed", 1)],
                1,
                1,
                1,
                1,
                0,
                0,
                null,
                null,
                null,
                null,
                0,
                null,
                null,
                null);

            return Task.FromResult(raw);
        }
    }
}
