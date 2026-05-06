namespace ArchLucid.Host.Core.Startup;

/// <summary>Set when <see cref="ArchLucid.Host.Core.Startup.ArchLucidPersistenceStartup"/> catches a DbUp failure.</summary>
public sealed class StartupMigrationHealthState
{
    private volatile bool _migrationFailed;

    public bool MigrationFailed => _migrationFailed;

    public void MarkMigrationFailed()
    {
        _migrationFailed = true;
    }
}
