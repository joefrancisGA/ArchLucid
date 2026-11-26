using System.Data;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Uses the configured connection only as a server/authentication template. Tests that mutate catalog-wide state
///     get a new, exclusively owned catalog and never open the configured catalog.
/// </summary>
public sealed class SqlServerDisposablePersistenceFixture : IAsyncLifetime
{
    public const string Category = "SqlServerDisposableCatalog";

    private const string OwnedCatalogPrefix = "ArchLucidPersistenceTest_";
    private string? _ownedConnectionString;
    private bool _ready;

    public bool IsSqlServerAvailable => _ready;

    public string ConnectionString => _ready
        ? _ownedConnectionString!
        : throw new InvalidOperationException("No verified disposable persistence catalog is ready.");

    public async Task InitializeAsync()
    {
        StructuralExecutionModeTypeHandler.Register();

        string? template = Environment.GetEnvironmentVariable(SqlServerPersistenceFixture.EnvironmentConnectionStringVariable);
        if (!string.IsNullOrWhiteSpace(template))
        {
            await using SqlConnection admin = CreateAdminConnection(template);
            await admin.OpenAsync();
            await CreateAndPrepareAsync(admin, template);
            return;
        }

        foreach (string candidate in SqlServerIntegrationTestConnections.EnumerateWindowsPersistenceFallbackConnectionStrings(
                     SqlServerPersistenceFixture.DefaultTestDatabaseName))
        {
            await using SqlConnection admin = CreateAdminConnection(candidate);
            try
            {
                await admin.OpenAsync();
            }
            catch (SqlException)
            {
                // An unavailable implicit Windows endpoint is optional. Provisioning failures after connection are not.
                continue;
            }

            await CreateAndPrepareAsync(admin, candidate);
            return;
        }
    }

    public Task DisposeAsync()
    {
        _ready = false;
        if (_ownedConnectionString is { } connectionString)
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
            _ownedConnectionString = null;
        }

        return Task.CompletedTask;
    }

    internal static SqlConnectionStringBuilder BuildOwnedCatalogConnection(string template) =>
        BuildConnection(template, OwnedCatalogPrefix + Guid.NewGuid().ToString("N"));

    private static SqlConnection CreateAdminConnection(string template) => new(BuildConnection(template, "master").ConnectionString);

    private static SqlConnectionStringBuilder BuildConnection(string template, string catalog) =>
        new(SqlServerIntegrationTestConnections.NormalizePersistenceConnectionString(template, catalog))
        {
            InitialCatalog = catalog,
            AttachDBFilename = string.Empty,
            ApplicationIntent = ApplicationIntent.ReadWrite,
            Pooling = false,
        };

    private async Task CreateAndPrepareAsync(SqlConnection admin, string template)
    {
        SqlConnectionStringBuilder owned = BuildOwnedCatalogConnection(template);
        const string create = """
                              DECLARE @sql nvarchar(256) = N'CREATE DATABASE ' + QUOTENAME(@name);
                              EXEC sys.sp_executesql @sql;
                              """;
        await using SqlCommand createCommand = new(create, admin) { CommandTimeout = 120 };
        createCommand.Parameters.Add("@name", SqlDbType.NVarChar, 128).Value = owned.InitialCatalog;
        // A strict CREATE is essential. Never adopt or drop an existing catalog, even on a name collision.
        await createCommand.ExecuteNonQueryAsync();
        _ownedConnectionString = owned.ConnectionString;

        try
        {
            await using (SqlConnection verified = new(owned.ConnectionString))
            {
                await verified.OpenAsync();
                if (!string.Equals(verified.Database, owned.InitialCatalog, StringComparison.Ordinal))
                    throw new InvalidOperationException("SQL did not open the catalog created by the fixture.");
            }

            await SqlServerPersistenceFixture.PrepareCatalogAsync(owned.ConnectionString);
            _ready = true;
        }
        catch (Exception setupError)
        {
            try
            {
                await DisposeAsync();
            }
            catch (Exception cleanupError)
            {
                throw new AggregateException("Disposable catalog setup and cleanup both failed.", setupError, cleanupError);
            }

            throw;
        }
    }
}

[CollectionDefinition(nameof(SqlServerDisposablePersistenceCollection))]
public sealed class SqlServerDisposablePersistenceCollection : ICollectionFixture<SqlServerDisposablePersistenceFixture>;
