namespace ArchLucid.Core.Configuration;

/// <summary>Merges legacy <see cref="QuickScanOptions" /> with authoritative <see cref="QuickScanSafetyOptions" /> bounds.</summary>
public static class QuickScanEffectiveLimits
{
    public static QuickScanOptions Merge(QuickScanOptions options, QuickScanSafetyOptions safety)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(safety);

        if (!safety.Enabled)
        {
            return options;
        }

        QuickScanSafetyPerRequestLimits perRequest = safety.PerRequest;

        return new QuickScanOptions
        {
            Enabled = options.Enabled,
            MaxEstimatedCostUsdPerScan = Math.Min(options.MaxEstimatedCostUsdPerScan, perRequest.MaxEstimatedCostPerRequest),
            MaxInputTokensPerScan = Math.Min(options.MaxInputTokensPerScan, perRequest.MaxInputTokens),
            MaxOutputTokensPerScan = Math.Min(options.MaxOutputTokensPerScan, perRequest.MaxOutputTokens),
            MaxModelCallsPerScan = Math.Min(options.MaxModelCallsPerScan, perRequest.MaxModelCallsPerRequest),
            MaxRetryCount = Math.Min(options.MaxRetryCount, perRequest.MaxTotalRetriesPerRequest),
            MaxProcessingDurationSeconds = Math.Min(options.MaxProcessingDurationSeconds, perRequest.MaxExecutionSeconds),
            MaxConcurrentScans = Math.Min(options.MaxConcurrentScans, safety.Concurrency.MaxConcurrentAnonymousScans),
            MaxScansPerSessionPerDay = options.MaxScansPerSessionPerDay,
            MaxScansPerIpPerHour = options.MaxScansPerIpPerHour,
            MaxScansPerIpPerDay = options.MaxScansPerIpPerDay,
            GlobalMaxRequestsPerHour = options.GlobalMaxRequestsPerHour,
            GlobalMaxRequestsPerDay = options.GlobalMaxRequestsPerDay,
            GlobalMaxSpendUsdPerHour = options.GlobalMaxSpendUsdPerHour,
            GlobalMaxSpendUsdPerDay = options.GlobalMaxSpendUsdPerDay,
            SignInRequiredAfterSessionScans = options.SignInRequiredAfterSessionScans,
            MaxFindingsReturned = options.MaxFindingsReturned,
            MaxSystemNameLength = Math.Min(options.MaxSystemNameLength, perRequest.MaxSystemNameCharacters),
            MaxDescriptionLength = Math.Min(options.MaxDescriptionLength, perRequest.MaxDescriptionCharacters),
            MaxArchitectureConcerns = options.MaxArchitectureConcerns,
        };
    }
}
