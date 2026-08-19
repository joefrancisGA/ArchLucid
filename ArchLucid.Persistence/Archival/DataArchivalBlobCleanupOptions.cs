namespace ArchLucid.Persistence.Archival;

/// <summary>Orphaned agent-trace blob cleanup toggles under <see cref="DataArchivalOptions.SectionName" />.</summary>
public sealed class DataArchivalBlobCleanupOptions
{
    /// <summary>When false, orphaned agent-trace blobs are not scanned or deleted.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Only blobs last modified before this many days ago are eligible for orphan deletion.</summary>
    public int MinAgeDays
    {
        get;
        set;
    } = 30;
}
