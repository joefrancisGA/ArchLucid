namespace ArchLucid.Persistence.Models;

/// <summary>
///     Row returned by <see cref="Interfaces.IManifestFinalizationSqlRepository.LockRunForFinalizationAsync" />
///     after acquiring an update lock on <c>dbo.Runs</c>.
/// </summary>
public sealed class ManifestFinalizationLockedRunRow
{
    public string? LegacyRunStatus
    {
        get;
        init;
    }

    public Guid? GoldenManifestId
    {
        get;
        init;
    }

    public string? CurrentManifestVersion
    {
        get;
        init;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        init;
    }

    public Guid? ArtifactBundleId
    {
        get;
        init;
    }

    public byte[] RowVersionStamp
    {
        get;
        init;
    } = null!;
}
