namespace ArchLucid.Core.Diagnostics;

/// <summary>Thread-safe holder for the latest stale in-flight run gauge snapshot (read on Prometheus scrape).</summary>
public sealed class StaleInFlightRunGaugeState
{
    private readonly Lock _gate = new();
    private StaleInFlightRunGaugeValues _current;

    public StaleInFlightRunGaugeValues Current
    {
        get
        {
            lock (_gate)
                return _current;
        }
    }

    public void Publish(in StaleInFlightRunGaugeValues values)
    {
        lock (_gate)
            _current = values;
    }
}
