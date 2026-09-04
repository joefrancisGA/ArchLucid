namespace ArchLucid.Core.Configuration;

public sealed partial class QuickScanSafetyOptionsValidator
{
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
}
