using System.Text; using System.Text.Json;
using ArchLucid.Application.Governance.FindingDisposition; using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit; using ArchLucid.Core.Configuration; using ArchLucid.Core.Integrations.Itsm; using ArchLucid.Persistence.Integrations;
using FluentAssertions; using Microsoft.Extensions.Logging.Abstractions; using Microsoft.Extensions.Options; using Moq;
namespace ArchLucid.Application.Tests.Integrations.Itsm;
public sealed class ItsmInboundWebhookProcessPipelineTests {
  [Fact] public async Task Jira_invalid_issue_key_format_returns_rejected_audit() {
    var pipeline = CreatePipeline(new Mock<IItsmFindingCorrelationRepository>().Object);
    const string json = """{"issue":{"key":"!!!","fields":{"status":{"name":"Done"}}}}""";
    using var doc = JsonDocument.Parse(json);
    var result = await pipeline.TryProcessUpdateAsync(CreateJiraDescriptor(), new ItsmInboundJiraPayloadReader(), new ItsmInboundJiraStatusMapper(), doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));
    result.Accepted.Should().BeFalse(); result.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraInboundWebhookRejected);
  }
  [Fact] public async Task ServiceNow_invalid_sys_id_format_returns_rejected_audit() {
    var pipeline = CreatePipeline(new Mock<IItsmFindingCorrelationRepository>().Object);
    const string json = """{"sys_id":"not-a-valid-sys-id","state":"6"}""";
    using var doc = JsonDocument.Parse(json);
    var result = await pipeline.TryProcessUpdateAsync(CreateServiceNowDescriptor(), new ItsmInboundServiceNowPayloadReader(), new ItsmInboundServiceNowStatusMapper(), doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));
    result.Accepted.Should().BeFalse(); result.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowInboundWebhookRejected);
  }
  private static ItsmInboundWebhookProcessPipeline CreatePipeline(IItsmFindingCorrelationRepository correlations) {
    var monitor = new Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>>(); monitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());
    var replay = new Mock<IItsmInboundWebhookReplayGuard>(); replay.Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
    return new ItsmInboundWebhookProcessPipeline(new ItsmInboundWebhookSyncSupport(correlations, replay.Object), monitor.Object, new ItsmInboundDispositionSync(new Mock<IFindingDispositionService>().Object, NullLogger<ItsmInboundDispositionSync>.Instance), Mock.Of<ArchLucid.Persistence.Interfaces.IFindingInspectReadRepository>(), Mock.Of<ArchLucid.Persistence.Queries.IAuthorityQueryService>(), Mock.Of<ArchLucid.Core.Manifest.IManifestHashService>(), NullLogger<ItsmInboundWebhookProcessPipeline>.Instance);
  }
  private static ItsmInboundWebhookProviderDescriptor CreateJiraDescriptor() => new() { ProviderName = "Jira", WebhookActorId = "jira-webhook", RejectedAuditEventType = AuditEventTypes.IntegrationJiraInboundWebhookRejected, SyncedAuditEventType = AuditEventTypes.IntegrationJiraIssueStatusSynced, UnknownStatusReasonCode = "jira_status_unknown", PayloadTooLargeAuditIsJira = true };
  private static ItsmInboundWebhookProviderDescriptor CreateServiceNowDescriptor() => new() { ProviderName = "ServiceNow", WebhookActorId = "servicenow-webhook", RejectedAuditEventType = AuditEventTypes.IntegrationServiceNowInboundWebhookRejected, SyncedAuditEventType = AuditEventTypes.IntegrationServiceNowIncidentStatusSynced, UnknownStatusReasonCode = "servicenow_state_unknown", PayloadTooLargeAuditIsJira = false };
}
