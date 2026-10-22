using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Safety;
using ArchLucid.Core.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28 package-coverage batch: billing webhook result factories, content-safety DTO round-trip, and technology
///     ledger cloud-target resolution.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28Tests
{
    [Fact]
    public void BillingWebhookHandleResult_Ok_marks_succeeded()
    {
        BillingWebhookHandleResult result = BillingWebhookHandleResult.Ok();

        result.Succeeded.Should().BeTrue();
        result.DuplicateIgnored.Should().BeFalse();
        result.Returns202Accepted.Should().BeFalse();
        result.IsReplayRejected.Should().BeFalse();
        result.ErrorDetail.Should().BeNull();
        result.MarketplaceWebhookReceived.Should().BeNull();
    }

    [Fact]
    public void BillingWebhookHandleResult_Ok_with_marketplace_payload_attaches_payload()
    {
        MarketplaceWebhookReceivedIntegrationPayload payload = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProviderDedupeKey = "dedupe-1",
            Action = "ChangePlan",
            SubscriptionId = "sub-1",
        };

        BillingWebhookHandleResult result = BillingWebhookHandleResult.Ok(payload);

        result.Succeeded.Should().BeTrue();
        result.MarketplaceWebhookReceived.Should().BeSameAs(payload);
        result.MarketplaceWebhookReceived!.Action.Should().Be("ChangePlan");
        result.MarketplaceWebhookReceived.BillingProvider.Should().Be(BillingProviderNames.AzureMarketplace);
    }

    [Fact]
    public void BillingWebhookHandleResult_Ok_null_marketplace_payload_throws()
    {
        FluentActions
            .Invoking(() => BillingWebhookHandleResult.Ok(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void BillingWebhookHandleResult_Duplicate_and_AcceptedDeferred_set_flags()
    {
        BillingWebhookHandleResult duplicate = BillingWebhookHandleResult.Duplicate();
        BillingWebhookHandleResult deferred = BillingWebhookHandleResult.AcceptedDeferred();

        duplicate.Succeeded.Should().BeTrue();
        duplicate.DuplicateIgnored.Should().BeTrue();

        deferred.Succeeded.Should().BeTrue();
        deferred.Returns202Accepted.Should().BeTrue();
    }

    [Fact]
    public void BillingWebhookHandleResult_ReplayRejected_requires_detail()
    {
        BillingWebhookHandleResult result = BillingWebhookHandleResult.ReplayRejected("replay window hit");

        result.IsReplayRejected.Should().BeTrue();
        result.Succeeded.Should().BeFalse();
        result.ErrorDetail.Should().Be("replay window hit");

        FluentActions
            .Invoking(() => BillingWebhookHandleResult.ReplayRejected("  "))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void BillingWebhookHandleResult_Rejected_keeps_detail_without_success()
    {
        BillingWebhookHandleResult result = BillingWebhookHandleResult.Rejected("signature invalid");

        result.Succeeded.Should().BeFalse();
        result.ErrorDetail.Should().Be("signature invalid");
    }

    [Fact]
    public void ContentSafetyResult_round_trips_properties()
    {
        ContentSafetyResult result = new(
            IsAllowed: false,
            BlockReason: "jailbreak",
            Category: "PromptInjection",
            Severity: 0.91);

        result.IsAllowed.Should().BeFalse();
        result.BlockReason.Should().Be("jailbreak");
        result.Category.Should().Be("PromptInjection");
        result.Severity.Should().Be(0.91);
    }

    [Fact]
    public void TechnologyLedgerEffectiveCloudTarget_uses_chosen_cloud_platform_when_present()
    {
        ArchitectureRequest request = new() { CloudProvider = CloudProvider.Aws };
        TechnologyLedgerEntry chosen = new()
        {
            Role = TechnologyLedgerRole.CloudPlatform,
            Status = TechnologyLedgerStatus.Chosen,
            ProviderFamily = CloudProvider.Azure,
            TechnologyName = "Azure",
        };

        CloudProvider resolved = TechnologyLedgerEffectiveCloudTarget.Resolve(request, [chosen]);

        resolved.Should().Be(CloudProvider.Azure);
    }

    [Fact]
    public void TechnologyLedgerEffectiveCloudTarget_falls_back_to_request_when_no_chosen_platform()
    {
        ArchitectureRequest request = new() { CloudProvider = CloudProvider.Gcp };
        TechnologyLedgerEntry assumed = new()
        {
            Role = TechnologyLedgerRole.CloudPlatform,
            Status = TechnologyLedgerStatus.Assumed,
            ProviderFamily = CloudProvider.Azure,
            TechnologyName = "Azure",
        };
        TechnologyLedgerEntry otherRole = new()
        {
            Role = TechnologyLedgerRole.PrimaryDatastore,
            Status = TechnologyLedgerStatus.Chosen,
            ProviderFamily = CloudProvider.Aws,
            TechnologyName = "Aurora",
        };

        CloudProvider resolved = TechnologyLedgerEffectiveCloudTarget.Resolve(request, [assumed, otherRole]);

        resolved.Should().Be(CloudProvider.Gcp);
    }

    [Fact]
    public void TechnologyLedgerEffectiveCloudTarget_rejects_null_arguments()
    {
        FluentActions
            .Invoking(() => TechnologyLedgerEffectiveCloudTarget.Resolve(null!, []))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("request");

        FluentActions
            .Invoking(() => TechnologyLedgerEffectiveCloudTarget.Resolve(new ArchitectureRequest(), null!))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("ledgerEntries");
    }
}
