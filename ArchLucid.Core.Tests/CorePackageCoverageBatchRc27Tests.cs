using System.Text;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Security;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC27 coverage batch for deterministic <c>ArchLucid.Core</c> helpers that carried no direct tests:
///     integration webhook payload samples, billing tier codes, RunId JSON conversion, private-network host
///     guards, tenant/warm catalog naming, null usage metering, and the in-memory audit retry queue.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc27Tests
{
    private const string LegacyVendorPrefix = "com." + "arch" + "iforge" + ".";
    [Theory]
    [InlineData("RunCommitted", IntegrationEventTypes.ManifestFinalizedV1)]
    [InlineData("ManifestFinalized", IntegrationEventTypes.ManifestFinalizedV1)]
    [InlineData("manifest-finalized", IntegrationEventTypes.ManifestFinalizedV1)]
    [InlineData("RunCompleted", IntegrationEventTypes.AuthorityRunCompletedV1)]
    [InlineData("AuthorityRunCompleted", IntegrationEventTypes.AuthorityRunCompletedV1)]
    [InlineData("authority-run-completed", IntegrationEventTypes.AuthorityRunCompletedV1)]
    [InlineData("GovernanceApprovalSubmitted", IntegrationEventTypes.GovernanceApprovalSubmittedV1)]
    [InlineData("governance-approval-submitted", IntegrationEventTypes.GovernanceApprovalSubmittedV1)]
    [InlineData("GovernanceApprovalApproved", IntegrationEventTypes.GovernanceApprovalApprovedV1)]
    [InlineData("governance-approval-approved", IntegrationEventTypes.GovernanceApprovalApprovedV1)]
    [InlineData("GovernanceApprovalRejected", IntegrationEventTypes.GovernanceApprovalRejectedV1)]
    [InlineData("governance-approval-rejected", IntegrationEventTypes.GovernanceApprovalRejectedV1)]
    [InlineData("GovernancePromotionActivated", IntegrationEventTypes.GovernancePromotionActivatedV1)]
    [InlineData("governance-promotion-activated", IntegrationEventTypes.GovernancePromotionActivatedV1)]
    [InlineData("AlertFired", IntegrationEventTypes.AlertFiredV1)]
    [InlineData("alert-fired", IntegrationEventTypes.AlertFiredV1)]
    [InlineData("AlertAcknowledged", IntegrationEventTypes.AlertAcknowledgedV1)]
    [InlineData("alert-acknowledged", IntegrationEventTypes.AlertAcknowledgedV1)]
    [InlineData("AlertResolved", IntegrationEventTypes.AlertResolvedV1)]
    [InlineData("alert-resolved", IntegrationEventTypes.AlertResolvedV1)]
    [InlineData("AdvisoryScanCompleted", IntegrationEventTypes.AdvisoryScanCompletedV1)]
    [InlineData("advisory-scan-completed", IntegrationEventTypes.AdvisoryScanCompletedV1)]
    [InlineData("ComplianceDriftEscalated", IntegrationEventTypes.ComplianceDriftEscalatedV1)]
    [InlineData("compliance-drift-escalated", IntegrationEventTypes.ComplianceDriftEscalatedV1)]
    [InlineData("DataConsistencyCheckCompleted", IntegrationEventTypes.DataConsistencyCheckCompletedV1)]
    [InlineData("data-consistency-check-completed", IntegrationEventTypes.DataConsistencyCheckCompletedV1)]
    public void ResolveEventType_maps_switch_aliases(string alias, string expected)
    {
        IntegrationWebhookPayloadSamples.ResolveEventType(alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveEventType_maps_legacy_vendor_alias_before_known_set_lookup()
    {
        string legacyAlias = LegacyVendorPrefix + "authority.run.completed";

        IntegrationWebhookPayloadSamples.ResolveEventType(legacyAlias)
            .Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    [Theory]
    [InlineData(IntegrationEventTypes.AuthorityRunCompletedV1)]
    [InlineData(IntegrationEventTypes.DataConsistencyCheckCompletedV1)]
    [InlineData(IntegrationEventTypes.ManifestFinalizedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalSubmittedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalApprovedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalRejectedV1)]
    [InlineData(IntegrationEventTypes.GovernancePromotionActivatedV1)]
    [InlineData(IntegrationEventTypes.AlertFiredV1)]
    [InlineData(IntegrationEventTypes.AlertAcknowledgedV1)]
    [InlineData(IntegrationEventTypes.AlertResolvedV1)]
    [InlineData(IntegrationEventTypes.AdvisoryScanCompletedV1)]
    [InlineData(IntegrationEventTypes.ComplianceDriftEscalatedV1)]
    [InlineData(IntegrationEventTypes.SeatReservationReleasedV1)]
    [InlineData(IntegrationEventTypes.TrialLifecycleEmailV1)]
    [InlineData(IntegrationEventTypes.BillingMarketplaceWebhookReceivedV1)]
    public void ResolveEventType_accepts_known_com_archlucid_constants_directly(string eventType)
    {
        IntegrationWebhookPayloadSamples.ResolveEventType(eventType).Should().Be(eventType);
        IntegrationWebhookPayloadSamples.ResolveEventType("  " + eventType + "  ").Should().Be(eventType);
    }

    [Fact]
    public void ResolveEventType_accepts_uppercase_canonical_event_type()
    {
        IntegrationWebhookPayloadSamples.ResolveEventType("COM.ARCHLUCID.AUTHORITY.RUN.COMPLETED")
            .Should()
            .Be(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ResolveEventType_throws_on_whitespace(string? alias)
    {
        Action act = () => IntegrationWebhookPayloadSamples.ResolveEventType(alias!);

        act.Should().Throw<ArgumentException>().WithParameterName("eventTypeAlias");
    }

    [Fact]
    public void ResolveEventType_throws_on_unknown_alias()
    {
        Action act = () => IntegrationWebhookPayloadSamples.ResolveEventType("NotARealEvent");

        act.Should().Throw<ArgumentException>()
            .WithParameterName("eventTypeAlias")
            .WithMessage("*Unknown event type alias*");
    }

    [Fact]
    public void GovernancePromotionActivated_webhook_sample_matches_schema_and_resolves_promotion_environment()
    {
        byte[] utf8 = IntegrationWebhookPayloadSamples.CreatePayloadUtf8(
            IntegrationEventTypes.GovernancePromotionActivatedV1);

        using JsonDocument document = JsonDocument.Parse(utf8);
        JsonElement root = document.RootElement;

        root.TryGetProperty("promotionRecordId", out _).Should().BeTrue();
        root.TryGetProperty("targetEnvironment", out _).Should().BeTrue();
        root.TryGetProperty("runId", out _).Should().BeTrue();
        root.TryGetProperty("tenantId", out _).Should().BeTrue();

        IReadOnlyDictionary<string, object>? props =
            IntegrationEventServiceBusApplicationProperties.TryResolveForPublish(
                IntegrationEventTypes.GovernancePromotionActivatedV1,
                utf8);

        props.Should().NotBeNull();
        props.Should().ContainKey(IntegrationEventServiceBusApplicationProperties.PromotionEnvironmentPropertyName);
    }

    [Theory]
    [InlineData(IntegrationEventTypes.AuthorityRunCompletedV1)]
    [InlineData(IntegrationEventTypes.ManifestFinalizedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalSubmittedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalApprovedV1)]
    [InlineData(IntegrationEventTypes.GovernanceApprovalRejectedV1)]
    [InlineData(IntegrationEventTypes.GovernancePromotionActivatedV1)]
    [InlineData(IntegrationEventTypes.AlertFiredV1)]
    [InlineData(IntegrationEventTypes.AlertAcknowledgedV1)]
    [InlineData(IntegrationEventTypes.AlertResolvedV1)]
    [InlineData(IntegrationEventTypes.AdvisoryScanCompletedV1)]
    [InlineData(IntegrationEventTypes.ComplianceDriftEscalatedV1)]
    [InlineData(IntegrationEventTypes.DataConsistencyCheckCompletedV1)]
    public void CreatePayload_and_CreatePayloadUtf8_support_wired_event_types(string eventType)
    {
        object payload = IntegrationWebhookPayloadSamples.CreatePayload(eventType);
        byte[] utf8 = IntegrationWebhookPayloadSamples.CreatePayloadUtf8(eventType);

        payload.Should().NotBeNull();
        utf8.Should().NotBeNullOrEmpty();

        using JsonDocument document = JsonDocument.Parse(utf8);
        document.RootElement.TryGetProperty("schemaVersion", out JsonElement schemaVersion).Should().BeTrue();
        schemaVersion.GetInt32().Should().Be(1);
    }

    [Theory]
    [InlineData(IntegrationEventTypes.SeatReservationReleasedV1)]
    [InlineData(IntegrationEventTypes.TrialLifecycleEmailV1)]
    [InlineData(IntegrationEventTypes.BillingMarketplaceWebhookReceivedV1)]
    public void CreatePayload_throws_for_unsupported_known_types(string eventType)
    {
        Action act = () => IntegrationWebhookPayloadSamples.CreatePayload(eventType);

        act.Should().Throw<ArgumentException>()
            .WithParameterName("resolvedEventType")
            .WithMessage("*No synthetic payload is wired*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CreatePayload_throws_on_whitespace(string? eventType)
    {
        Action act = () => IntegrationWebhookPayloadSamples.CreatePayload(eventType!);

        act.Should().Throw<ArgumentException>().WithParameterName("resolvedEventType");
    }

    [Theory]
    [InlineData(BillingCheckoutTier.Team, nameof(TenantTier.Standard), "Team")]
    [InlineData(BillingCheckoutTier.Architect, nameof(TenantTier.Standard), "Architect")]
    [InlineData(BillingCheckoutTier.Pro, nameof(TenantTier.Standard), "Pro")]
    [InlineData(BillingCheckoutTier.Enterprise, nameof(TenantTier.Enterprise), "Enterprise")]
    public void BillingTierCode_maps_known_checkout_tiers(
        BillingCheckoutTier tier,
        string expectedCode,
        string expectedLabel)
    {
        BillingTierCode.FromCheckoutTier(tier).Should().Be(expectedCode);
        BillingTierCode.CheckoutTierLabel(tier).Should().Be(expectedLabel);
    }

    [Fact]
    public void BillingTierCode_out_of_range_cast_falls_back_to_standard_and_team_label()
    {
        const BillingCheckoutTier unknown = (BillingCheckoutTier)99;

        BillingTierCode.FromCheckoutTier(unknown).Should().Be(nameof(TenantTier.Standard));
        BillingTierCode.CheckoutTierLabel(unknown).Should().Be("Team");
    }

    [Fact]
    public void RunIdJsonConverter_round_trips_guid_string()
    {
        Guid value = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        RunId runId = new(value);

        string json = JsonSerializer.Serialize(runId);
        RunId roundTripped = JsonSerializer.Deserialize<RunId>(json);

        json.Should().Be("\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\"");
        roundTripped.Value.Should().Be(value);
    }

    [Theory]
    [InlineData("123")]
    [InlineData("true")]
    [InlineData("{}")]
    [InlineData("[\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\"]")]
    public void RunIdJsonConverter_throws_for_invalid_token_types(string json)
    {
        Action act = () => JsonSerializer.Deserialize<RunId>(json);

        act.Should().Throw<JsonException>().WithMessage("*Expected string for RunId*");
    }

    [Theory]
    [InlineData("\"\"")]
    [InlineData("\"   \"")]
    [InlineData("\"not-a-guid\"")]
    public void RunIdJsonConverter_throws_for_bad_guid_strings(string json)
    {
        Action act = () => JsonSerializer.Deserialize<RunId>(json);

        act.Should().Throw<JsonException>().WithMessage("*RunId must be a valid GUID string*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void IsForbiddenHostLiteral_null_or_blank_is_forbidden(string? host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host!).Should().BeTrue();
    }

    [Theory]
    [InlineData("localhost")]
    [InlineData("LOCALHOST")]
    [InlineData("127.0.0.1")]
    [InlineData("10.0.0.1")]
    [InlineData("10.255.255.255")]
    [InlineData("172.16.0.1")]
    [InlineData("172.31.255.255")]
    [InlineData("192.168.1.1")]
    [InlineData("169.254.1.1")]
    [InlineData("0.0.0.0")]
    [InlineData("0")]
    [InlineData("::")]
    [InlineData("::1")]
    [InlineData("fe80::1")]
    [InlineData("ff02::1")]
    public void IsForbiddenHostLiteral_private_and_special_addresses_are_forbidden(string host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeTrue();
    }

    [Theory]
    [InlineData("example.com")]
    [InlineData("api.archlucid.net")]
    [InlineData("8.8.8.8")]
    [InlineData("172.15.0.1")]
    [InlineData("172.32.0.1")]
    [InlineData("192.167.0.1")]
    [InlineData("2001:4860:4860::8888")]
    public void IsForbiddenHostLiteral_public_hosts_are_allowed(string host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeFalse();
    }

    [Theory]
    [InlineData("0.0.0.0")]
    [InlineData("0")]
    [InlineData("::")]
    public void IsForbiddenHostLiteral_unspecified_addresses_are_forbidden(string host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeTrue();
    }

    [Fact]
    public void WarmTenantCatalogNaming_and_TenantDatabaseNaming_use_fixed_guid_format()
    {
        Guid standbyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        WarmTenantCatalogNaming.SqlLogicalNameForStandby(standbyId)
            .Should().Be("archlucid_warm_11111111222233334444555555555555");
        TenantDatabaseNaming.SqlLogicalNameForTenant(tenantId)
            .Should().Be("archlucid_tenant_aaaaaaaabbbbccccddddeeeeeeeeeeee");
    }

    [Fact]
    public async Task NullUsageMeteringService_record_and_summary_complete_without_error()
    {
        NullUsageMeteringService sut = new();
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset periodStart = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset periodEnd = new(2026, 8, 31, 0, 0, 0, TimeSpan.Zero);

        UsageEvent usageEvent = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = periodStart,
            CorrelationId = "corr-rc27",
            IdempotencyKey = "idem-rc27",
        };

        await sut.RecordAsync(usageEvent, CancellationToken.None);
        await sut.RecordBatchAsync([usageEvent], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summary = await sut.GetSummaryAsync(
            tenantId,
            periodStart,
            periodEnd,
            CancellationToken.None);

        summary.Should().BeEmpty();
    }

    [Fact]
    public void InMemoryAuditRetryQueue_ctor_capacity_less_than_one_throws()
    {
        Action act = () => _ = new InMemoryAuditRetryQueue(0);

        act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("capacity");
    }

    [Fact]
    public void InMemoryAuditRetryQueue_TryEnqueue_null_throws()
    {
        InMemoryAuditRetryQueue queue = new(2);

        Action act = () => queue.TryEnqueue(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("auditEvent");
    }

    [Fact]
    public async Task InMemoryAuditRetryQueue_enqueue_dequeue_and_notify_updates_pending()
    {
        InMemoryAuditRetryQueue queue = new(2);
        AuditEvent auditEvent = NewAuditEvent("EnqueueSuccess");

        queue.TryEnqueue(auditEvent).Should().BeTrue();
        queue.ApproximatePendingCount.Should().Be(1);

        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);
        dequeued.EventType.Should().Be("EnqueueSuccess");
        dequeued.EventId.Should().Be(auditEvent.EventId);
        dequeued.DataJson.Should().Be(auditEvent.DataJson);
        dequeued.CorrelationId.Should().Be(auditEvent.CorrelationId);
        dequeued.RunId.Should().Be(auditEvent.RunId);
        dequeued.ManifestId.Should().Be(auditEvent.ManifestId);
        dequeued.ArtifactId.Should().Be(auditEvent.ArtifactId);
        dequeued.ExplicitActor.Should().BeTrue();

        queue.NotifyPersistedSuccess();
        queue.ApproximatePendingCount.Should().Be(0);
    }

    [Fact]
    public async Task InMemoryAuditRetryQueue_capacity_one_second_enqueue_is_dropped_from_channel()
    {
        // BoundedChannelFullMode.DropWrite keeps the buffered item and discards the write; TryWrite still returns true.
        InMemoryAuditRetryQueue queue = new(1);
        AuditEvent first = NewAuditEvent("First");
        AuditEvent second = NewAuditEvent("Second");

        queue.TryEnqueue(first).Should().BeTrue();
        queue.TryEnqueue(second).Should().BeTrue();

        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);
        dequeued.EventType.Should().Be("First");
    }

    [Fact]
    public async Task InMemoryAuditRetryQueue_TryReturnToQueueAfterFailedDrain_requeues_when_space_available()
    {
        InMemoryAuditRetryQueue queue = new(1);
        AuditEvent auditEvent = NewAuditEvent("DrainRetry");

        queue.TryEnqueue(auditEvent).Should().BeTrue();
        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);

        queue.TryReturnToQueueAfterFailedDrain(dequeued).Should().BeTrue();

        AuditEvent requeued = await queue.DequeueAsync(CancellationToken.None);
        requeued.EventId.Should().Be(auditEvent.EventId);
        requeued.EventType.Should().Be("DrainRetry");
    }

    [Fact]
    public void InMemoryAuditRetryQueue_TryReturnToQueueAfterFailedDrain_null_throws()
    {
        InMemoryAuditRetryQueue queue = new(2);

        Action act = () => queue.TryReturnToQueueAfterFailedDrain(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("auditEvent");
    }

    private static AuditEvent NewAuditEvent(string eventType)
    {
        return new AuditEvent
        {
            EventId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            OccurredUtc = new DateTime(2026, 8, 9, 12, 0, 0, DateTimeKind.Utc),
            EventType = eventType,
            ActorUserId = "actor-1",
            ActorUserName = "Actor One",
            ExplicitActor = true,
            TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            RunId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            ManifestId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            ArtifactId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            DataJson = "{\"k\":\"v\"}",
            CorrelationId = "corr-audit-rc27",
        };
    }
}
