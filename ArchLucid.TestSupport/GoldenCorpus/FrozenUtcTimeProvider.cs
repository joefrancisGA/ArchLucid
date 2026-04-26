namespace ArchLucid.TestSupport.GoldenCorpus;

/// <summary><see cref="TimeProvider" /> pinned to a single UTC instant for deterministic golden outputs.</summary>
public sealed class FrozenUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    /// <inheritdoc />
    public override DateTimeOffset GetUtcNow()
    {
        return utcNow;
    }
}
