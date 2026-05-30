namespace ArchLucid.Api.Tests;

/// <summary>
///     Saves and restores <c>ArchLucid__StorageProvider</c> for one integration host lifetime. <see cref="Program" /> calls
///     <c>AddEnvironmentVariables()</c>, so process env wins over in-memory WebApplicationFactory configuration; greenfield
///     SQL factories must force <c>Sql</c> and <see cref="ArchLucidApiFactory" /> must force <c>InMemory</c> so sequential
///     tests do not inherit the wrong DI registrar after a prior factory disposes incompletely.
/// </summary>
internal sealed class IntegrationTestStorageProviderEnvironment : IDisposable
{
    private const string StorageProviderKey = "ArchLucid__StorageProvider";

    private readonly string? _previousValue;

    private readonly bool _hadPreviousValue;

    internal IntegrationTestStorageProviderEnvironment(string requiredValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requiredValue);

        _previousValue = Environment.GetEnvironmentVariable(StorageProviderKey);
        _hadPreviousValue = _previousValue is not null;

        Environment.SetEnvironmentVariable(StorageProviderKey, requiredValue);
    }

    public void Dispose()
    {
        if (_hadPreviousValue)
            Environment.SetEnvironmentVariable(StorageProviderKey, _previousValue);
        else
            Environment.SetEnvironmentVariable(StorageProviderKey, null);
    }
}
