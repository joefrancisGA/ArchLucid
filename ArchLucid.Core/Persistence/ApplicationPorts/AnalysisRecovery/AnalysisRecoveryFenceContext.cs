namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Claims propagated to independently committed SQL writers inside one analysis attempt.</summary>
public sealed class AnalysisRecoveryFenceContext : IDisposable
{
    private static readonly AsyncLocal<AnalysisRecoveryFenceContext?> Active = new();

    private AnalysisRecoveryFenceContext(AnalysisRecoveryStageKey key, Guid owner, long fence, DateTime? observationUtc)
    {
        Key = key;
        Owner = owner;
        Fence = fence;
        ObservationUtc = observationUtc;
        Previous = Active.Value;
        Active.Value = this;
    }

    public static AnalysisRecoveryFenceContext? Current => Active.Value;
    public AnalysisRecoveryStageKey Key { get; }
    public Guid Owner { get; }
    public long Fence { get; }
    public DateTime? ObservationUtc { get; }
    public AnalysisRecoveryFenceContext? Previous { get; }

    public static IDisposable Enter(AnalysisRecoveryStageKey key, Guid owner, long fence, DateTime? observationUtc) =>
        new AnalysisRecoveryFenceContext(key, owner, fence, observationUtc);

    public void Dispose() => Active.Value = Previous;
}
