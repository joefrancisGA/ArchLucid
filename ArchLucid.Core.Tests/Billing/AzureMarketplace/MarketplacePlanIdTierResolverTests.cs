using System.Diagnostics.Metrics;

using ArchLucid.Core.Billing.AzureMarketplace;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Core.Tests.Billing.AzureMarketplace;

[Trait("Category", "Unit")]
public sealed class MarketplacePlanIdTierResolverTests
{
    [Theory]
    [InlineData("contoso-enterprise", nameof(TenantTier.Enterprise))]
    [InlineData("Contoso-Enterprise-Plan", nameof(TenantTier.Enterprise))]
    [InlineData("team", nameof(TenantTier.Standard))]
    [InlineData("  team  ", nameof(TenantTier.Standard))]
    public void ResolveTierStorageCode_maps_configured_plan_ids(string planId, string expectedTier)
    {
        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());

        sut.ResolveTierStorageCode(planId).Should().Be(expectedTier);
    }

    [Fact]
    public void ResolveTierStorageCode_maps_enterprise_when_plan_id_tier_map_key_has_bounding_whitespace()
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                PlanIdTierMap = new Dictionary<string, string>
                {
                    ["  contoso-enterprise  "] = nameof(TenantTier.Enterprise),
                },
            },
        };

        new BillingOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, billing);

        MarketplacePlanIdTierResolver sut = CreateResolver(billing.AzureMarketplace.PlanIdTierMap!);

        sut.ResolveTierStorageCode("contoso-enterprise").Should().Be(nameof(TenantTier.Enterprise));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ResolveTierStorageCode_blank_plan_id_defaults_to_standard(string? planId)
    {
        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());

        sut.ResolveTierStorageCode(planId).Should().Be(nameof(TenantTier.Standard));
    }

    [Theory]
    [InlineData("unknown-partner-plan")]
    [InlineData("42424242")]
    public void ResolveTierStorageCode_unknown_plan_id_defaults_to_standard(string planId)
    {
        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());

        sut.ResolveTierStorageCode(planId).Should().Be(nameof(TenantTier.Standard));
    }

    [Theory]
    [InlineData("not-for-enterprise")]
    [InlineData("non-enterprise")]
    [InlineData("enterprise-trial")]
    [InlineData("contoso-not-for-enterprise-standard")]
    [InlineData("NOT-FOR-ENTERPRISE")]
    [InlineData("not_for_enterprise")]
    [InlineData("enterprise-non-standard")]
    [InlineData("contoso-stripe-enterprise-monthly")]
    [InlineData("NonEnterpriseStandard")]
    [InlineData("contoso/enterprise/monthly")]
    public void ResolveTierStorageCode_adversarial_plan_ids_never_infer_enterprise_without_map_entry(string planId)
    {
        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());

        sut.ResolveTierStorageCode(planId).Should().Be(nameof(TenantTier.Standard));
    }

    [Fact]
    public void ResolveTierStorageCode_increments_unknown_plan_id_metric_for_unmapped_plan()
    {
        _ = ArchLucidInstrumentation.MarketplaceUnknownPlanIdsTotal;

        using UnknownPlanIdMeasurementCapture capture = UnknownPlanIdMeasurementCapture.Start();

        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());
        sut.ResolveTierStorageCode("not-for-enterprise");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_marketplace_unknown_plan_ids_total" && m.Value == 1);
    }

    [Fact]
    public void ResolveTierStorageCode_does_not_increment_metric_for_mapped_plan()
    {
        _ = ArchLucidInstrumentation.MarketplaceUnknownPlanIdsTotal;

        using UnknownPlanIdMeasurementCapture capture = UnknownPlanIdMeasurementCapture.Start();

        MarketplacePlanIdTierResolver sut = CreateResolver(CreateSampleMap());
        sut.ResolveTierStorageCode("contoso-enterprise");

        capture.LongMeasures.Should().BeEmpty();
    }

    private static Dictionary<string, string> CreateSampleMap() =>
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["contoso-enterprise"] = nameof(TenantTier.Enterprise),
            ["Contoso-Enterprise-Plan"] = nameof(TenantTier.Enterprise),
            ["team"] = nameof(TenantTier.Standard),
        };

    private static MarketplacePlanIdTierResolver CreateResolver(Dictionary<string, string> planIdTierMap)
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions { PlanIdTierMap = planIdTierMap },
        };

        Mock<IOptionsMonitor<BillingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(billing);

        return new MarketplacePlanIdTierResolver(monitor.Object, NullLogger<MarketplacePlanIdTierResolver>.Instance);
    }

    private sealed class UnknownPlanIdMeasurementCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly MeterListener _listener = new();

        private UnknownPlanIdMeasurementCapture()
        {
            _listener.InstrumentPublished = static (instrument, meterListener) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                    return;

                if (instrument.Name == "archlucid_marketplace_unknown_plan_ids_total")
                    meterListener.EnableMeasurementEvents(instrument);
            };

            _listener.SetMeasurementEventCallback<long>(OnMeasurementLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static UnknownPlanIdMeasurementCapture Start() => new();

        private void OnMeasurementLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;

            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                tagList.Add(tag);

            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, tagList));
        }
    }

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);
}
