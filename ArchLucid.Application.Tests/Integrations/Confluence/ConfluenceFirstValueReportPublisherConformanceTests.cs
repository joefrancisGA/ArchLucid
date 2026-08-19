using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Confluence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConfluenceFirstValueReportPublisherConformanceTests
{
    private const string ConnectorName = "Confluence first-value report publisher";

    private static Mock<IOptionsMonitor<ConfluencePublishingOptions>> PublisherOptionsEnabled()
    {
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ConfluencePublishingOptions { Enabled = true });

        return monitor;
    }

    [Fact]
    public async Task Publish_conformance_preserves_tenant_workspace_project_on_publish_request()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByRunIdAdminAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = runGuid,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId,
                    CurrentManifestVersion = "v9"
                });

        const string markdown = "# Title\nConformance body.";
        Mock<IFirstValueReportBuilder> reportBuilder = new();
        reportBuilder
            .Setup(b => b.BuildMarkdownAsync(runGuid.ToString("N"), "https://api.test", It.IsAny<CancellationToken>()))
            .ReturnsAsync(markdown);

        CapturingPublisherConnector connector = new();
        ConfluenceFirstValueReportPublisher sut = new(
            runs.Object,
            reportBuilder.Object,
            connector,
            PublisherOptionsEnabled().Object,
            NullLogger<ConfluenceFirstValueReportPublisher>.Instance);

        PublishOutcome outcome =
            await sut.PublishFirstValueReportAsync(runGuid.ToString("N"), "https://api.test", CancellationToken.None);

        outcome.Succeeded.Should().BeTrue(because: $"{ConnectorName}: happy path must succeed when publisher accepts request.");
        connector.LastRequest.Should().NotBeNull();

        PublishRequest req = connector.LastRequest!;

        req.TenantId.Should().Be(tenantId, because: $"{ConnectorName}: PublishRequest.TenantId must match the run record.");
        req.WorkspaceId.Should().Be(workspaceId, because: $"{ConnectorName}: PublishRequest.WorkspaceId must match the run record.");
        req.ProjectId.Should().Be(projectId, because: $"{ConnectorName}: PublishRequest.ProjectId must match the run record.");
        req.PayloadJson.Should().Be(markdown, because: $"{ConnectorName}: authority Markdown payload must flow verbatim.");
    }

    [Fact]
    public async Task Publish_conformance_when_disabled_does_not_invoke_connector()
    {
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ConfluencePublishingOptions { Enabled = false });

        Mock<IPublisherConnector> connector = new();
        ConfluenceFirstValueReportPublisher sut = new(
            Mock.Of<IRunRepository>(),
            Mock.Of<IFirstValueReportBuilder>(),
            connector.Object,
            monitor.Object,
            NullLogger<ConfluenceFirstValueReportPublisher>.Instance);

        PublishOutcome outcome =
            await sut.PublishFirstValueReportAsync(
                "dddddddddddddddddddddddddddddddd",
                "https://api.test",
                CancellationToken.None);

        outcome.Succeeded.Should().BeFalse(because: $"{ConnectorName}: disabled gate must not report success.");
        outcome.ErrorMessage.Should().Contain("disabled", because: $"{ConnectorName}: operators need an explicit disable reason.");
        connector.Verify(
            c => c.PublishDocumentAsync(It.IsAny<PublishRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Publish_conformance_when_run_id_invalid_does_not_invoke_connector()
    {
        Mock<IPublisherConnector> connector = new();
        ConfluenceFirstValueReportPublisher sut = new(
            Mock.Of<IRunRepository>(),
            Mock.Of<IFirstValueReportBuilder>(),
            connector.Object,
            PublisherOptionsEnabled().Object,
            NullLogger<ConfluenceFirstValueReportPublisher>.Instance);

        PublishOutcome outcome =
            await sut.PublishFirstValueReportAsync("not-a-run-key", "https://api.test", CancellationToken.None);

        outcome.Succeeded.Should().BeFalse();
        outcome.FailureReason.Should().Be(ConfluencePublishFailureReason.BadResponse);
        connector.Verify(
            c => c.PublishDocumentAsync(It.IsAny<PublishRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Publish_conformance_when_connector_returns_failure_outcome_is_surfaced()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByRunIdAdminAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = runGuid,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId,
                    CurrentManifestVersion = "v9"
                });

        const string markdown = "# Title\nConformance body.";
        Mock<IFirstValueReportBuilder> reportBuilder = new();
        reportBuilder
            .Setup(b => b.BuildMarkdownAsync(runGuid.ToString("N"), "https://api.test", It.IsAny<CancellationToken>()))
            .ReturnsAsync(markdown);

        Mock<IPublisherConnector> connector = new();
        connector
            .Setup(c => c.PublishDocumentAsync(It.IsAny<PublishRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PublishOutcome(false, null, ConfluencePublishFailureReason.ServerError, "upstream unavailable"));

        ConfluenceFirstValueReportPublisher sut = new(
            runs.Object,
            reportBuilder.Object,
            connector.Object,
            PublisherOptionsEnabled().Object,
            NullLogger<ConfluenceFirstValueReportPublisher>.Instance);

        PublishOutcome outcome =
            await sut.PublishFirstValueReportAsync(runGuid.ToString("N"), "https://api.test", CancellationToken.None);

        outcome.Succeeded.Should().BeFalse(because: $"{ConnectorName}: publisher failures must not be coerced to success.");
        outcome.FailureReason.Should().Be(ConfluencePublishFailureReason.ServerError);
        outcome.ErrorMessage.Should().Contain("unavailable");
    }

    private sealed class CapturingPublisherConnector : IPublisherConnector
    {
        public PublishingTargetKind Kind => PublishingTargetKind.ConfluenceCloud;

        public PublishRequest? LastRequest
        {
            get;
            private set;
        }

        public Task<PublishOutcome> PublishDocumentAsync(PublishRequest request, CancellationToken cancellationToken)
        {
            LastRequest = request;

            return Task.FromResult(new PublishOutcome(true, "page-1", null, null));
        }
    }
}
