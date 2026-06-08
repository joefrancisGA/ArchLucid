namespace ArchLucid.Api.Tests;

/// <summary>
///     Saves and restores <c>ConnectionStrings__ArchLucid</c> for one integration host lifetime.
///     <see cref="Program" /> calls <c>AddEnvironmentVariables()</c> after JSON, so process env wins over
///     <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> in-memory configuration;
///     Sql-backed factories must pin the ephemeral catalog connection string here (not only
///     <c>ConnectionStrings:ArchLucid</c> in-memory) or Linux CI falls back to appsettings
///     <c>Trusted_Connection=True</c> and SSPI fails.
/// </summary>
internal sealed class IntegrationTestSqlCatalogEnvironment : IDisposable
{
    private const string ConnectionStringKey = "ConnectionStrings__ArchLucid";

    private readonly string? _previousValue;

    private readonly bool _hadPreviousValue;

    internal IntegrationTestSqlCatalogEnvironment(string sqlConnectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sqlConnectionString);

        _previousValue = Environment.GetEnvironmentVariable(ConnectionStringKey);
        _hadPreviousValue = _previousValue is not null;

        Environment.SetEnvironmentVariable(ConnectionStringKey, sqlConnectionString);
    }

    public void Dispose()
    {
        if (_hadPreviousValue)
            Environment.SetEnvironmentVariable(ConnectionStringKey, _previousValue);
        else
            Environment.SetEnvironmentVariable(ConnectionStringKey, null);
    }
}
