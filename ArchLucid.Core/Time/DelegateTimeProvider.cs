namespace ArchLucid.Core.Time;

/// <summary>Test or bridge <see cref="TimeProvider" /> backed by a delegate returning UTC wall clock.</summary>
internal sealed class DelegateTimeProvider(Func<DateTimeOffset> getUtcNow) : TimeProvider
{
    private readonly Func<DateTimeOffset> _getUtcNow = getUtcNow ?? throw new ArgumentNullException(nameof(getUtcNow));

    public override DateTimeOffset GetUtcNow()
    {
        return _getUtcNow();
    }
}
