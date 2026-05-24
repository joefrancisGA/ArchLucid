namespace ArchLucid.Core.Diagnostics;

/// <summary>Reads cumulative cache counters for admin diagnostics.</summary>
public interface ICacheTelemetrySnapshotProvider
{
    CacheTelemetrySnapshot GetSnapshot();
}
