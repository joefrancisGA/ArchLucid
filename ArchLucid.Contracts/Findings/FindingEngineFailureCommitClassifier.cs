namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Two-tier finding-engine failure taxonomy at commit time: safety-critical engines block decisioning; advisory engines
///     degrade coverage but remain committable.
/// </summary>
public static class FindingEngineFailureCommitClassifier
{
    /// <summary>
    ///     Returns <see langword="true" /> when a failed engine should block authority decisioning and commit.
    /// </summary>
    public static bool IsCommitBlocking(FindingEngineFailure failure, bool compliancePackRequired = true)
    {
        ArgumentNullException.ThrowIfNull(failure);

        if (IsSecurityCategory(failure.Category))
            return true;

        if (compliancePackRequired && IsComplianceCategory(failure.Category))
            return true;

        return false;
    }

    /// <summary>Returns <see langword="true" /> when any failure in the list blocks commit.</summary>
    public static bool HasCommitBlockingFailures(
        IReadOnlyList<FindingEngineFailure> failures,
        bool compliancePackRequired = true)
    {
        ArgumentNullException.ThrowIfNull(failures);

        foreach (FindingEngineFailure failure in failures)
        {

            if (IsCommitBlocking(failure, compliancePackRequired))
                return true;
        }

        return false;
    }

    /// <summary>Returns advisory-only failures (degraded-but-committable).</summary>
    public static IReadOnlyList<FindingEngineFailure> SelectAdvisoryFailures(
        IReadOnlyList<FindingEngineFailure> failures,
        bool compliancePackRequired = true)
    {
        ArgumentNullException.ThrowIfNull(failures);

        List<FindingEngineFailure> advisory = [];

        foreach (FindingEngineFailure failure in failures)
        {

            if (!IsCommitBlocking(failure, compliancePackRequired))
                advisory.Add(failure);
        }

        return advisory;
    }

    private static bool IsSecurityCategory(string category)
    {
        return string.Equals(category, "Security", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsComplianceCategory(string category)
    {
        return string.Equals(category, "Compliance", StringComparison.OrdinalIgnoreCase);
    }
}
