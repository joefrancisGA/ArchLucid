namespace ArchLucid.Api.Tests;

/// <summary>
///     Saves and restores SQL catalog environment variables for one integration host lifetime.
///     <see cref="Program" /> calls <c>AddEnvironmentVariables()</c> after JSON, so process env wins over
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> in-memory configuration;
///     Sql-backed factories must pin the ephemeral catalog connection string here (not only
///     <c>ConnectionStrings:ArchLucid</c> in-memory) or Linux CI falls back to appsettings
///     <c>Trusted_Connection=True</c> and SSPI fails.
///     Greenfield hosts also pin <c>ConnectionStrings:ArchLucidSystem</c> and
///     <c>ArchLucid:SqlTopology:Mode</c> so control-plane inserts and duplicate lookups cannot diverge when a
///     developer or CI agent exports split-catalog topology variables.
/// </summary>
internal sealed class IntegrationTestSqlCatalogEnvironment : IDisposable
{
    private const string ConnectionStringKey = "ConnectionStrings__ArchLucid";

    private const string SystemConnectionStringKey = "ConnectionStrings__ArchLucidSystem";

    private const string SqlTopologyModeKey = "ArchLucid__SqlTopology__Mode";

    private readonly string? _previousConnectionString;

    private readonly bool _hadPreviousConnectionString;

    private readonly string? _previousSystemConnectionString;

    private readonly bool _hadPreviousSystemConnectionString;

    private readonly bool _pinnedSystemConnectionString;

    private readonly string? _previousSqlTopologyMode;

    private readonly bool _hadPreviousSqlTopologyMode;

    private readonly bool _pinnedSingleCatalogTopology;

    internal IntegrationTestSqlCatalogEnvironment(string sqlConnectionString)
        : this(sqlConnectionString, pinSystemCatalogToSameDatabase: false, pinSingleCatalogTopology: false)
    {
    }

    internal IntegrationTestSqlCatalogEnvironment(
        string sqlConnectionString,
        bool pinSystemCatalogToSameDatabase,
        bool pinSingleCatalogTopology)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sqlConnectionString);

        _previousConnectionString = Environment.GetEnvironmentVariable(ConnectionStringKey);
        _hadPreviousConnectionString = _previousConnectionString is not null;
        Environment.SetEnvironmentVariable(ConnectionStringKey, sqlConnectionString);

        _pinnedSystemConnectionString = pinSystemCatalogToSameDatabase;

        if (_pinnedSystemConnectionString)
        {
            _previousSystemConnectionString = Environment.GetEnvironmentVariable(SystemConnectionStringKey);
            _hadPreviousSystemConnectionString = _previousSystemConnectionString is not null;
            Environment.SetEnvironmentVariable(SystemConnectionStringKey, sqlConnectionString);
        }

        _pinnedSingleCatalogTopology = pinSingleCatalogTopology;

        if (_pinnedSingleCatalogTopology)
        {
            _previousSqlTopologyMode = Environment.GetEnvironmentVariable(SqlTopologyModeKey);
            _hadPreviousSqlTopologyMode = _previousSqlTopologyMode is not null;
            Environment.SetEnvironmentVariable(SqlTopologyModeKey, "SingleCatalog");
        }
    }

    public void Dispose()
    {
        if (_hadPreviousConnectionString)
            Environment.SetEnvironmentVariable(ConnectionStringKey, _previousConnectionString);
        else
            Environment.SetEnvironmentVariable(ConnectionStringKey, null);

        if (_pinnedSystemConnectionString)
        {
            if (_hadPreviousSystemConnectionString)
                Environment.SetEnvironmentVariable(SystemConnectionStringKey, _previousSystemConnectionString);
            else
                Environment.SetEnvironmentVariable(SystemConnectionStringKey, null);
        }

        if (_pinnedSingleCatalogTopology)
        {
            if (_hadPreviousSqlTopologyMode)
                Environment.SetEnvironmentVariable(SqlTopologyModeKey, _previousSqlTopologyMode);
            else
                Environment.SetEnvironmentVariable(SqlTopologyModeKey, null);
        }
    }
}
