using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Configuration;

public sealed partial class QuickScanSafetyOptionsValidator
{
    private bool RequiresProductionLikeAnonymousGuardrails()
    {
        if (_hostEnvironment.IsProduction() || _hostEnvironment.IsStaging())
        {
            return true;
        }

        if (string.Equals(_hostEnvironment.EnvironmentName, "SaaS", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string? archLucidEnv = _configuration["ARCHLUCID_ENVIRONMENT"];

        if (string.IsNullOrWhiteSpace(archLucidEnv))
        {
            archLucidEnv = Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");
        }

        if (string.IsNullOrWhiteSpace(archLucidEnv))
        {
            return false;
        }

        string trimmed = archLucidEnv.Trim();

        return string.Equals(trimmed, "Production", StringComparison.OrdinalIgnoreCase)
               || string.Equals(trimmed, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateProgressiveFriction(QuickScanSafetyProgressiveFrictionLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.ScansBeforeCaptchaRequired, $"{Prefix}.ProgressiveFriction.ScansBeforeCaptchaRequired");
        AppendPositive(failures, limits.ScansBeforeSignInRequired, $"{Prefix}.ProgressiveFriction.ScansBeforeSignInRequired");
    }

    private static void ValidateModels(
        QuickScanSafetyModelLimits limits,
        QuickScanSafetyEffectiveFeatureState effective,
        List<string> failures)
    {
        AppendNonNegativeMoney(failures, limits.MaxInputPricePerMillionTokens, $"{Prefix}.Models.MaxInputPricePerMillionTokens");
        AppendNonNegativeMoney(failures, limits.MaxOutputPricePerMillionTokens, $"{Prefix}.Models.MaxOutputPricePerMillionTokens");

        if (!effective.SampleFallbackEnabled)
        {
            return;
        }

        if (limits.ApprovedFallbackModelIds.Count == 0
            || limits.ApprovedFallbackModelIds.All(static id => string.IsNullOrWhiteSpace(id)))
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: Models.ApprovedFallbackModelIds must be non-empty when SampleFallbackEnabled is true.");
        }
    }

    private static void ValidateAbuse(QuickScanSafetyAbuseLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.DuplicateDetectionWindowSeconds, $"{Prefix}.Abuse.DuplicateDetectionWindowSeconds");
        AppendPositive(failures, limits.BurstRequestsPerMinuteThreshold, $"{Prefix}.Abuse.BurstRequestsPerMinuteThreshold");
        AppendPositive(
            failures,
            limits.BurstRequestsPerFiveMinutesThreshold,
            $"{Prefix}.Abuse.BurstRequestsPerFiveMinutesThreshold");
    }

    private static void ValidateTelemetry(QuickScanSafetyTelemetryLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.RetentionDays, $"{Prefix}.Telemetry.RetentionDays");
    }

    private static void ValidateProductionLikeAnonymousRequirements(QuickScanSafetyOptions options, List<string> failures)
    {
        QuickScanSafetyGlobalBudgetLimits budget = options.GlobalBudget;
        QuickScanSafetyPerRequestLimits perRequest = options.PerRequest;
        QuickScanSafetyConcurrencyLimits concurrency = options.Concurrency;
        QuickScanSafetyModelLimits models = options.Models;

        if (budget.MaxAnonymousSpendPerHour <= 0m)
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: GlobalBudget.MaxAnonymousSpendPerHour must be positive when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (budget.MaxAnonymousSpendPerDay <= 0m)
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: GlobalBudget.MaxAnonymousSpendPerDay must be positive when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (concurrency.MaxConcurrentAnonymousScans <= 0)
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: Concurrency.MaxConcurrentAnonymousScans must be positive when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (perRequest.MaxInputTokens <= 0)
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: PerRequest.MaxInputTokens must be positive when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (perRequest.MaxOutputTokens <= 0)
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: PerRequest.MaxOutputTokens must be positive when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (models.AllowedModelIds.Count == 0 || models.AllowedModelIds.All(static id => string.IsNullOrWhiteSpace(id)))
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: Models.AllowedModelIds must be non-empty when AnonymousExecutionEnabled is true in production-like environments.");
        }

        if (string.IsNullOrWhiteSpace(models.DefaultModelId))
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: Models.DefaultModelId is required when AnonymousExecutionEnabled is true in production-like environments.");
        }
    }
}
