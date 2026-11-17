namespace ArchLucid.Application.SecureNow;

/// <summary>Process-local admission limits for collection triggering. Distributed quotas are separate.</summary>
public sealed class SecureNowCapacityOptions
{
    public const string SectionName = "SecureNow:Capacity";
    public const int ActiveCollectionTriggers = 8;
    public int MaxWaitingCollectionTriggers { get; set; } = 100;
    public int AdmissionTimeoutSeconds { get; set; } = 5;

    public void Validate()
    {
        if (MaxWaitingCollectionTriggers is < 1 or > 10000)
            throw new ArgumentOutOfRangeException(nameof(MaxWaitingCollectionTriggers));
        if (AdmissionTimeoutSeconds is < 1 or > 300)
            throw new ArgumentOutOfRangeException(nameof(AdmissionTimeoutSeconds));
    }
}
