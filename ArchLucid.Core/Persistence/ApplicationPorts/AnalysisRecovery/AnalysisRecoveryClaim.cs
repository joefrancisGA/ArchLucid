namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>A persisted stage claim or terminal checkpoint. A fence never resets on redelivery.</summary>
public sealed class AnalysisRecoveryClaim
{
    public string State { get; init; } = string.Empty;
    public string InputVersion { get; init; } = string.Empty;
    public string? ResultReference { get; init; }
    public Guid? Owner { get; init; }
    public long Fence { get; init; }
    public int Attempts { get; init; }
    public DateTime? LeaseUntilUtc { get; init; }
}
