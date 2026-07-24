using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Fail-closed validation for <see cref="QuickScanSafetyOptions" /> (TB-892).
///     Production/SaaS hosts reject anonymous execution without mandatory spend, token, concurrency, and model guardrails.
/// </summary>
public sealed class QuickScanSafetyOptionsValidator(
    IHostEnvironment hostEnvironment,
    IConfiguration configuration) : IValidateOptions<QuickScanSafetyOptions>
{
    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, QuickScanSafetyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        List<string> failures = [];
        QuickScanSafetyEffectiveFeatureState effective = options.ResolveEffectiveFeatureState();

        ValidateFeatureState(options, failures);
        ValidatePerRequest(options.PerRequest, failures);
        ValidateConcurrency(options.Concurrency, failures);
        ValidateIdentity(options.Identity, failures);
        ValidateGlobalRequests(options.GlobalRequests, failures);
        ValidateGlobalBudget(options.GlobalBudget, failures);
        ValidateProgressiveFriction(options.ProgressiveFriction, failures);
        ValidateModels(options.Models, effective, failures);
        ValidateAbuse(options.Abuse, failures);
        ValidateTelemetry(options.Telemetry, failures);

        if (RequiresProductionLikeAnonymousGuardrails() && effective.AnonymousExecutionEnabled)
        {
            ValidateProductionLikeAnonymousRequirements(options, failures);
        }

        if (failures.Count > 0)
        {
            return ValidateOptionsResult.Fail(failures);
        }

        return ValidateOptionsResult.Success;
    }

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

    private static void ValidateFeatureState(QuickScanSafetyOptions options, List<string> failures)
    {
        if (options.EmergencyDisabled && string.IsNullOrWhiteSpace(options.EmergencyDisabledMessage))
        {
            failures.Add(
                $"{QuickScanSafetyOptions.SectionPath}: EmergencyDisabledMessage is required when EmergencyDisabled is true.");
        }
    }

    private static void ValidatePerRequest(QuickScanSafetyPerRequestLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxRequestBodyBytes, $"{Prefix}.PerRequest.MaxRequestBodyBytes");
        AppendPositive(failures, limits.MaxSystemNameCharacters, $"{Prefix}.PerRequest.MaxSystemNameCharacters");
        AppendPositive(failures, limits.MaxDescriptionCharacters, $"{Prefix}.PerRequest.MaxDescriptionCharacters");
        AppendPositive(failures, limits.MaxInputTokens, $"{Prefix}.PerRequest.MaxInputTokens");
        AppendPositive(failures, limits.MaxOutputTokens, $"{Prefix}.PerRequest.MaxOutputTokens");
        AppendNonNegativeMoney(failures, limits.MaxEstimatedCostPerRequest, $"{Prefix}.PerRequest.MaxEstimatedCostPerRequest");
        AppendPositive(failures, limits.MaxModelCallsPerRequest, $"{Prefix}.PerRequest.MaxModelCallsPerRequest");
        AppendNonNegative(failures, limits.MaxToolCallsPerRequest, $"{Prefix}.PerRequest.MaxToolCallsPerRequest");
        AppendNonNegative(failures, limits.MaxRetriesPerModelCall, $"{Prefix}.PerRequest.MaxRetriesPerModelCall");
        AppendNonNegative(failures, limits.MaxTotalRetriesPerRequest, $"{Prefix}.PerRequest.MaxTotalRetriesPerRequest");
        AppendPositive(failures, limits.MaxExecutionSeconds, $"{Prefix}.PerRequest.MaxExecutionSeconds");
    }

    private static void ValidateConcurrency(QuickScanSafetyConcurrencyLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxConcurrentAnonymousScans, $"{Prefix}.Concurrency.MaxConcurrentAnonymousScans");
        AppendNonNegative(failures, limits.MaxQueuedAnonymousScans, $"{Prefix}.Concurrency.MaxQueuedAnonymousScans");
        AppendPositive(failures, limits.QueueWaitTimeoutSeconds, $"{Prefix}.Concurrency.QueueWaitTimeoutSeconds");
        AppendPositive(failures, limits.LeaseDurationSeconds, $"{Prefix}.Concurrency.LeaseDurationSeconds");
        AppendPositive(failures, limits.LeaseRenewalIntervalSeconds, $"{Prefix}.Concurrency.LeaseRenewalIntervalSeconds");
    }

    private static void ValidateIdentity(QuickScanSafetyIdentityLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxScansPerSessionPerHour, $"{Prefix}.Identity.MaxScansPerSessionPerHour");
        AppendPositive(failures, limits.MaxScansPerSessionPerDay, $"{Prefix}.Identity.MaxScansPerSessionPerDay");
        AppendPositive(failures, limits.MaxScansPerBrowserPerHour, $"{Prefix}.Identity.MaxScansPerBrowserPerHour");
        AppendPositive(failures, limits.MaxScansPerBrowserPerDay, $"{Prefix}.Identity.MaxScansPerBrowserPerDay");
        AppendPositive(failures, limits.MaxScansPerIpPerHour, $"{Prefix}.Identity.MaxScansPerIpPerHour");
        AppendPositive(failures, limits.MaxScansPerIpPerDay, $"{Prefix}.Identity.MaxScansPerIpPerDay");
        AppendPositive(failures, limits.MaxScansPerIpRangePerHour, $"{Prefix}.Identity.MaxScansPerIpRangePerHour");
        AppendPositive(failures, limits.MaxScansPerIpRangePerDay, $"{Prefix}.Identity.MaxScansPerIpRangePerDay");
    }

    private static void ValidateGlobalRequests(QuickScanSafetyGlobalRequestLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxAnonymousRequestsPerHour, $"{Prefix}.GlobalRequests.MaxAnonymousRequestsPerHour");
        AppendPositive(failures, limits.MaxAnonymousRequestsPerDay, $"{Prefix}.GlobalRequests.MaxAnonymousRequestsPerDay");
    }

    private static void ValidateGlobalBudget(QuickScanSafetyGlobalBudgetLimits limits, List<string> failures)
    {
        AppendNonNegativeMoney(failures, limits.MaxAnonymousSpendPerHour, $"{Prefix}.GlobalBudget.MaxAnonymousSpendPerHour");
        AppendNonNegativeMoney(failures, limits.MaxAnonymousSpendPerDay, $"{Prefix}.GlobalBudget.MaxAnonymousSpendPerDay");
        AppendPositive(failures, limits.BudgetReservationTtlMinutes, $"{Prefix}.GlobalBudget.BudgetReservationTtlMinutes");
        AppendNonNegativeMoney(failures, limits.BudgetAccountingGracePercent, $"{Prefix}.GlobalBudget.BudgetAccountingGracePercent");
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

    private static void AppendPositive(List<string> failures, int value, string fieldName)
    {
        if (value <= 0)
        {
            failures.Add($"{fieldName} must be greater than zero.");
        }
    }

    private static void AppendNonNegative(List<string> failures, int value, string fieldName)
    {
        if (value < 0)
        {
            failures.Add($"{fieldName} must be greater than or equal to zero.");
        }
    }

    private static void AppendNonNegativeMoney(List<string> failures, decimal value, string fieldName)
    {
        if (value < 0m)
        {
            failures.Add($"{fieldName} must be greater than or equal to zero.");
        }
    }

    private const string Prefix = QuickScanSafetyOptions.SectionPath;
}
