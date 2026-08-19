namespace ArchLucid.Contracts.Architecture;

/// <summary>Plain-language public capacity signal for the Quick Scan marketing funnel (TB-900).</summary>
public enum QuickScanPublicCapacityState
{
    Available = 0,
    VerificationRequired = 1,
    AnonymousLimit = 2,
    Busy = 3,
    DemonstrationCapacity = 4,
    SampleOnly = 5,
    TemporarilyUnavailable = 6,
}
