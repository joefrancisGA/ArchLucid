using System.Text.Json;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IQuickScanCostEstimator" />
public sealed class QuickScanCostEstimator(
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IOptionsMonitor<QuickScanModelPricingCatalogOptions> catalogOptions,
    ILlmCostEstimator llmCostEstimator) : IQuickScanCostEstimator
{
    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IOptionsMonitor<QuickScanModelPricingCatalogOptions> _catalogOptions =
        catalogOptions ?? throw new ArgumentNullException(nameof(catalogOptions));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    /// <inheritdoc />
    public QuickScanCostEstimateResult TryReserveCost(
        QuickScanRequestValidator.ValidatedQuickScanRequest validated,
        string? clientRequestedModelId,
        DateTimeOffset utcNow)
    {
        ArgumentNullException.ThrowIfNull(validated);

        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyModelLimits models = safety.Models;

        if (models.RejectClientModelSelection
            && !string.IsNullOrWhiteSpace(clientRequestedModelId)
            && !string.Equals(clientRequestedModelId.Trim(), models.DefaultModelId, StringComparison.OrdinalIgnoreCase))
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.ClientModelOverrideRejected);
        }

        string modelId = models.DefaultModelId.Trim();

        if (modelId.Length == 0)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.UnknownModel);
        }

        if (!models.AllowedModelIds.Any(id => string.Equals(id.Trim(), modelId, StringComparison.OrdinalIgnoreCase)))
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.UnapprovedModel);
        }

        QuickScanModelPricingCatalogEntry? entry = ResolveCatalogEntry(modelId);

        if (entry is null)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.UnknownModel);
        }

        QuickScanModelPricingCatalogOptions catalog = _catalogOptions.CurrentValue;
        DateTimeOffset staleCutoff = utcNow.AddDays(-Math.Max(1, catalog.MaxPricingAgeDays));

        QuickScanCostEstimateRejectionReason? entryRejection = ValidateCatalogEntryForReservation(entry, models, staleCutoff);

        if (entryRejection.HasValue)
        {
            return QuickScanCostEstimateResult.Reject(entryRejection.Value);
        }

        Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(validated);
        string userPayload = JsonSerializer.Serialize(files);
        int estimatedInputTokens = QuickScanInputTokenEstimator.EstimateTokens(QuickScanLlmSystemPrompt.Text, userPayload);
        int reservedInputTokens = Math.Min(estimatedInputTokens, safety.PerRequest.MaxInputTokens);
        int reservedOutputTokens = Math.Min(safety.PerRequest.MaxOutputTokens, entry.MaxOutputTokens);

        if (reservedInputTokens <= 0 || reservedOutputTokens <= 0)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.TokenEstimateUnsafe);
        }

        if (reservedInputTokens + reservedOutputTokens > entry.MaxContextTokens)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.TokenEstimateUnsafe);
        }

        decimal? baseUsd = EstimateUsd(entry, reservedInputTokens, reservedOutputTokens);

        if (!baseUsd.HasValue)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.EstimationFailed);
        }

        int retryAttempts = Math.Max(0, safety.PerRequest.MaxTotalRetriesPerRequest);
        decimal retryExposureUsd = baseUsd.Value * retryAttempts;

        decimal fallbackExposureUsd = 0m;

        if (safety.SampleFallbackEnabled && models.ApprovedFallbackModelIds.Count > 0)
        {
            QuickScanCostEstimateResult? fallbackRejection = TryEstimateMaxFallbackExposureUsd(
                models.ApprovedFallbackModelIds,
                models,
                staleCutoff,
                reservedInputTokens,
                reservedOutputTokens,
                out fallbackExposureUsd);

            if (fallbackRejection is not null)
            {
                return fallbackRejection;
            }
        }

        decimal totalReservedUsd = baseUsd.Value + retryExposureUsd + fallbackExposureUsd;

        if (totalReservedUsd > safety.PerRequest.MaxEstimatedCostPerRequest)
        {
            return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.OverPerRequestBudget);
        }

        QuickScanReservedCostBreakdown reservation = new()
        {
            ModelId = modelId,
            ReservedInputTokens = reservedInputTokens,
            ReservedOutputTokens = reservedOutputTokens,
            BaseUsd = baseUsd.Value,
            RetryExposureUsd = retryExposureUsd,
            FallbackExposureUsd = fallbackExposureUsd,
            TotalReservedUsd = totalReservedUsd,
        };

        return QuickScanCostEstimateResult.Permit(reservation);
    }

    private QuickScanModelPricingCatalogEntry? ResolveCatalogEntry(string modelId)
    {
        return _catalogOptions.CurrentValue.Entries
            .FirstOrDefault(entry => string.Equals(entry.ModelId.Trim(), modelId, StringComparison.OrdinalIgnoreCase));
    }

    private static QuickScanCostEstimateRejectionReason? ValidateCatalogEntryForReservation(
        QuickScanModelPricingCatalogEntry entry,
        QuickScanSafetyModelLimits models,
        DateTimeOffset staleCutoff)
    {
        if (!entry.IsActive)
        {
            return QuickScanCostEstimateRejectionReason.InactiveModel;
        }

        if (!entry.ApprovedForAnonymousQuickScan)
        {
            return QuickScanCostEstimateRejectionReason.UnapprovedModel;
        }

        if (!string.Equals(entry.Currency, "USD", StringComparison.OrdinalIgnoreCase))
        {
            return QuickScanCostEstimateRejectionReason.UnsupportedCurrency;
        }

        if (entry.LastVerifiedUtc < staleCutoff)
        {
            return QuickScanCostEstimateRejectionReason.StalePricing;
        }

        if (entry.InputUsdPerMillionTokens > models.MaxInputPricePerMillionTokens
            || entry.OutputUsdPerMillionTokens > models.MaxOutputPricePerMillionTokens)
        {
            return QuickScanCostEstimateRejectionReason.OverUnitPriceCap;
        }

        return null;
    }

    private QuickScanCostEstimateResult? TryEstimateMaxFallbackExposureUsd(
        IReadOnlyList<string> fallbackModelIds,
        QuickScanSafetyModelLimits models,
        DateTimeOffset staleCutoff,
        int reservedInputTokens,
        int reservedOutputTokens,
        out decimal fallbackExposureUsd)
    {
        fallbackExposureUsd = 0m;
        decimal maxFallback = 0m;

        foreach (string fallbackModelId in fallbackModelIds)
        {
            if (string.IsNullOrWhiteSpace(fallbackModelId))
            {
                continue;
            }

            QuickScanModelPricingCatalogEntry? entry = ResolveCatalogEntry(fallbackModelId.Trim());

            if (entry is null)
            {
                return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.UnknownModel);
            }

            QuickScanCostEstimateRejectionReason? entryRejection = ValidateCatalogEntryForReservation(entry, models, staleCutoff);

            if (entryRejection.HasValue)
            {
                return QuickScanCostEstimateResult.Reject(entryRejection.Value);
            }

            decimal? fallbackUsd = EstimateUsd(entry, reservedInputTokens, reservedOutputTokens);

            if (!fallbackUsd.HasValue)
            {
                return QuickScanCostEstimateResult.Reject(QuickScanCostEstimateRejectionReason.EstimationFailed);
            }

            if (fallbackUsd.Value > maxFallback)
            {
                maxFallback = fallbackUsd.Value;
            }
        }

        fallbackExposureUsd = maxFallback;

        return null;
    }

    private decimal? EstimateUsd(QuickScanModelPricingCatalogEntry entry, int inputTokens, int outputTokens)
    {
        if (!string.IsNullOrWhiteSpace(entry.LlmCostEstimatorDeploymentLabel))
        {
            decimal? fromEstimator = _llmCostEstimator.EstimateUsd(
                inputTokens,
                outputTokens,
                reasoningTokens: 0,
                deploymentLabel: entry.LlmCostEstimatorDeploymentLabel);

            if (fromEstimator.HasValue)
            {
                return fromEstimator.Value;
            }
        }

        if (inputTokens < 0 || outputTokens < 0)
        {
            return null;
        }

        decimal inPart = inputTokens * entry.InputUsdPerMillionTokens / 1_000_000m;
        decimal outPart = outputTokens * entry.OutputUsdPerMillionTokens / 1_000_000m;

        return inPart + outPart;
    }
}
