using System.Text;
using System.Text.Json;

using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Application.Tests.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

/// <summary>LP-17 / ADR 0076 — ITSM inbound disposition CAS vs human current pointer.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
[Trait("Backlog", "TB-988")]
public sealed class ItsmInboundDispositionConcurrentRaceTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid WorkspaceA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ProjectA = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly Guid DefaultRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Fact]
    public async Task Jira_inbound_disposition_conflict_skips_human_review_update_and_surfaces_conflict_audit()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService dispositionService = FindingDispositionServiceTestFactory.Create(trailRepository);
        ScopeContext scope = new()
        {
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
        };

        FindingDispositionEventDto humanDisposition = await dispositionService.RecordAsync(
            new RecordFindingDispositionRequest
            {
                FindingId = "f-race",
                Disposition = FindingDisposition.Accepted,
                Rationale = "human accepted concurrent risk",
                TradeOffAcknowledgment = "accepting concurrent trade-off for pilot scope",
            },
            scope,
            "alice",
            CancellationToken.None);

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-99", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = TenantA,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f-race",
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(TenantA, "f-race", It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ItsmInboundWebhookSyncService sut = CreateSutWithDispositionService(
            correlations,
            dispositionService,
            new IntegrationsItsmInboundOptions
            {
                JiraStatusDispositionMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Done"] = nameof(FindingDisposition.Remediated),
                },
            },
            currentDispositionRowVersionBase64: null);

        const string json = """{"issue":{"key":"KK-99","fields":{"status":{"name":"Done"}}}}""";
        using JsonDocument doc = JsonDocument.Parse(json);

        ItsmInboundWebhookProcessResult result = await sut.TryProcessJiraIssueUpdateAsync(
            doc.RootElement,
            CancellationToken.None,
            Encoding.UTF8.GetByteCount(json));

        result.Accepted.Should().BeTrue();
        JsonDocument payload = JsonDocument.Parse(result.DurableAuditEvent!.DataJson);
        payload.RootElement.GetProperty("dispositionConflict").GetBoolean().Should().BeTrue();
        payload.RootElement.GetProperty("dispositionSkipReason").GetString().Should().Be("disposition_conflict");
        payload.RootElement.GetProperty("rowsUpdated").GetInt32().Should().Be(0);
        payload.RootElement.GetProperty("currentDisposition").GetString().Should().Be(nameof(FindingDisposition.Accepted));

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-race",
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        trailRepository.EventCount.Should().Be(1);
    }

    private static ItsmInboundWebhookSyncService CreateSutWithDispositionService(
        Mock<IItsmFindingCorrelationRepository> correlations,
        IFindingDispositionService dispositionService,
        IntegrationsItsmInboundOptions inboundOptions,
        string? currentDispositionRowVersionBase64 = null)
    {
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(inboundOptions);

        ItsmInboundDispositionSync dispositionSync =
            new(dispositionService, NullLogger<ItsmInboundDispositionSync>.Instance);

        Mock<IItsmInboundWebhookReplayGuard> replay = new();
        replay
            .Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ScopeContext defaultScope = new()
        {
            TenantId = TenantA,
            WorkspaceId = WorkspaceA,
            ProjectId = ProjectA,
        };

        Mock<IFindingInspectReadRepository> inspectRepository = new();
        inspectRepository
            .Setup(r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((ScopeContext _, string findingId, CancellationToken _, FindingInspectReadOptions? __) =>
                new FindingInspectResponse
                {
                    FindingId = findingId,
                    RunId = DefaultRunId,
                    LatestDisposition = FindingDisposition.Accepted,
                    LatestDispositionRowVersionBase64 = currentDispositionRowVersionBase64,
                });

        IAuthorityQueryService authorityQueryService =
            ItsmOutboundSealedManifestTestSupport.CreateAuthorityQueryService(defaultScope, DefaultRunId);
        IManifestHashService manifestHashService =
            ItsmOutboundSealedManifestTestSupport.CreateManifestHashService();

        ItsmInboundWebhookSyncSupport support = new(correlations.Object, replay.Object);
        ItsmInboundWebhookProcessPipeline pipeline = new(
            support,
            monitor.Object,
            dispositionSync,
            inspectRepository.Object,
            authorityQueryService,
            manifestHashService,
            NullLogger<ItsmInboundWebhookProcessPipeline>.Instance);

        return new ItsmInboundWebhookSyncService(
            new ItsmInboundJiraWebhookProcessor(pipeline, new ItsmInboundJiraPayloadReader(), new ItsmInboundJiraStatusMapper()),
            new ItsmInboundServiceNowWebhookProcessor(
                pipeline,
                new ItsmInboundServiceNowPayloadReader(),
                new ItsmInboundServiceNowStatusMapper()));
    }
}
