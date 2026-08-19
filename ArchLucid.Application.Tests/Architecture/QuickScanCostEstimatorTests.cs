using ArchLucid.Application.Architecture;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanInputTokenEstimatorTests
{
    [Fact]
    public void EstimateTokens_uses_chars_per_four_heuristic_plus_overhead()
    {
        string userPayload = new string('a', 400);

        int tokens = QuickScanInputTokenEstimator.EstimateTokens("system prompt text", userPayload);

        tokens.Should().BeGreaterThan(100);
    }
}

[Trait("Category", "Unit")]
public sealed class QuickScanCostEstimatorTests
{
    private static readonly DateTimeOffset FreshUtc = new(2026, 7, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void TryReserveCost_permits_known_model_within_budget()
    {
        QuickScanCostEstimator estimator = CreateEstimator(CreateSafetyOptions(), CreateCatalogOptions());
        QuickScanRequestValidator.ValidatedQuickScanRequest validated = CreateValidatedRequest();

        QuickScanCostEstimateResult result = estimator.TryReserveCost(validated, clientRequestedModelId: null, FreshUtc);

        result.Allowed.Should().BeTrue();
        result.Reservation.Should().NotBeNull();
        result.Reservation!.ModelId.Should().Be("gpt-4o-mini");
        result.Reservation.TotalReservedUsd.Should().BeGreaterThan(0m);
        result.Reservation.TotalReservedUsd.Should().BeLessThanOrEqualTo(0.05m);
    }

    [Fact]
    public void TryReserveCost_rejects_unknown_model()
    {
        QuickScanSafetyOptions safety = CreateSafetyOptions();
        safety.Models.DefaultModelId = "missing-model";
        safety.Models.AllowedModelIds = ["missing-model"];

        QuickScanCostEstimator estimator = CreateEstimator(safety, CreateCatalogOptions());

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.UnknownModel);
    }

    [Fact]
    public void TryReserveCost_rejects_stale_pricing()
    {
        QuickScanModelPricingCatalogOptions catalog = CreateCatalogOptions();
        catalog.Entries[0].LastVerifiedUtc = FreshUtc.AddDays(-120);

        QuickScanCostEstimator estimator = CreateEstimator(CreateSafetyOptions(), catalog);

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.StalePricing);
    }

    [Fact]
    public void TryReserveCost_rejects_unapproved_model()
    {
        QuickScanModelPricingCatalogOptions catalog = CreateCatalogOptions();
        catalog.Entries[0].ApprovedForAnonymousQuickScan = false;

        QuickScanCostEstimator estimator = CreateEstimator(CreateSafetyOptions(), catalog);

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.UnapprovedModel);
    }

    [Fact]
    public void TryReserveCost_rejects_client_model_override()
    {
        QuickScanCostEstimator estimator = CreateEstimator(CreateSafetyOptions(), CreateCatalogOptions());

        QuickScanCostEstimateResult result = estimator.TryReserveCost(
            CreateValidatedRequest(),
            clientRequestedModelId: "gpt-4o",
            FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.ClientModelOverrideRejected);
    }

    [Fact]
    public void TryReserveCost_includes_retry_exposure_in_reservation()
    {
        QuickScanSafetyOptions safety = CreateSafetyOptions();
        safety.PerRequest.MaxTotalRetriesPerRequest = 2;

        QuickScanCostEstimator estimator = CreateEstimator(safety, CreateCatalogOptions());

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeTrue();
        result.Reservation!.RetryExposureUsd.Should().Be(result.Reservation.BaseUsd * 2);
        result.Reservation.TotalReservedUsd.Should().Be(result.Reservation.BaseUsd + result.Reservation.RetryExposureUsd);
    }

    [Fact]
    public void TryReserveCost_rejects_when_total_exceeds_per_request_budget()
    {
        QuickScanSafetyOptions safety = CreateSafetyOptions();
        safety.PerRequest.MaxEstimatedCostPerRequest = 0.000001m;

        QuickScanCostEstimator estimator = CreateEstimator(safety, CreateCatalogOptions());

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.OverPerRequestBudget);
    }

    [Fact]
    public void TryReserveCost_rejects_when_unit_price_exceeds_cap()
    {
        QuickScanSafetyOptions safety = CreateSafetyOptions();
        safety.Models.MaxOutputPricePerMillionTokens = 0.01m;

        QuickScanCostEstimator estimator = CreateEstimator(safety, CreateCatalogOptions());

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.OverUnitPriceCap);
    }

    [Fact]
    public void TryReserveCost_rejects_when_fallback_pricing_is_stale()
    {
        QuickScanModelPricingCatalogOptions catalog = CreateCatalogOptions();
        catalog.Entries[1].LastVerifiedUtc = FreshUtc.AddDays(-120);

        QuickScanCostEstimator estimator = CreateEstimator(CreateSafetyOptions(), catalog);

        QuickScanCostEstimateResult result = estimator.TryReserveCost(CreateValidatedRequest(), null, FreshUtc);

        result.Allowed.Should().BeFalse();
        result.RejectionReason.Should().Be(QuickScanCostEstimateRejectionReason.StalePricing);
    }

    private static QuickScanRequestValidator.ValidatedQuickScanRequest CreateValidatedRequest() =>
        new(
            SystemName: "Payment API",
            PrimaryEnvironment: "Azure",
            PrimaryEnvironmentOther: null,
            Description: "Processes card payments with PCI scope.",
            ArchitectureConcerns: ["Security"]);

    private static QuickScanSafetyOptions CreateSafetyOptions() =>
        new()
        {
            Enabled = true,
            SampleFallbackEnabled = true,
            PerRequest = new QuickScanSafetyPerRequestLimits
            {
                MaxInputTokens = 4_000,
                MaxOutputTokens = 1_200,
                MaxEstimatedCostPerRequest = 0.05m,
            },
            Models = new QuickScanSafetyModelLimits
            {
                AllowedModelIds = ["gpt-4o-mini"],
                DefaultModelId = "gpt-4o-mini",
                ApprovedFallbackModelIds = ["gpt-4o-mini-sample"],
                RejectClientModelSelection = true,
            },
        };

    private static QuickScanModelPricingCatalogOptions CreateCatalogOptions() =>
        new()
        {
            MaxPricingAgeDays = 90,
            Entries =
            [
                new QuickScanModelPricingCatalogEntry
                {
                    ModelId = "gpt-4o-mini",
                    Provider = "OpenAI",
                    ProviderModelId = "gpt-4o-mini",
                    InputUsdPerMillionTokens = 0.15m,
                    OutputUsdPerMillionTokens = 0.60m,
                    Currency = "USD",
                    IsActive = true,
                    ApprovedForAnonymousQuickScan = true,
                    MaxContextTokens = 128_000,
                    MaxOutputTokens = 4_096,
                    LastVerifiedUtc = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
                },
                new QuickScanModelPricingCatalogEntry
                {
                    ModelId = "gpt-4o-mini-sample",
                    Provider = "ArchLucid",
                    ProviderModelId = "sample",
                    InputUsdPerMillionTokens = 0m,
                    OutputUsdPerMillionTokens = 0m,
                    Currency = "USD",
                    IsActive = true,
                    ApprovedForAnonymousQuickScan = true,
                    MaxContextTokens = 128_000,
                    MaxOutputTokens = 4_096,
                    LastVerifiedUtc = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
                },
            ],
        };

    private static QuickScanCostEstimator CreateEstimator(
        QuickScanSafetyOptions safety,
        QuickScanModelPricingCatalogOptions catalog)
    {
        Mock<IOptionsMonitor<QuickScanSafetyOptions>> safetyMonitor = new();
        safetyMonitor.Setup(m => m.CurrentValue).Returns(safety);

        Mock<IOptionsMonitor<QuickScanModelPricingCatalogOptions>> catalogMonitor = new();
        catalogMonitor.Setup(m => m.CurrentValue).Returns(catalog);

        Mock<ILlmCostEstimator> llmCostEstimator = new();
        llmCostEstimator
            .Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns((int input, int output, int _, string? _) =>
                input * 0.15m / 1_000_000m + output * 0.60m / 1_000_000m);

        return new QuickScanCostEstimator(safetyMonitor.Object, catalogMonitor.Object, llmCostEstimator.Object);
    }
}
