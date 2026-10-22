namespace ArchLucid.Api.Tests;

/// <summary>
///     Saves and restores <c>ArchLucid__StorageProvider</c> for one integration host lifetime. <see cref="Program" /> calls
///     <c>AddEnvironmentVariables()</c>, so process env wins over in-memory WebApplicationFactory configuration; greenfield
///     SQL factories must force <c>Sql</c> and <see cref="ArchLucidApiFactory" /> must force <c>InMemory</c> so sequential
///     tests do not inherit the wrong DI registrar after a prior factory disposes incompletely.
///     Call <see cref="Apply" /> under <see cref="IntegrationTestStorageProviderHostGate" /> immediately before host startup.
/// </summary>
internal sealed class IntegrationTestStorageProviderEnvironment : IDisposable
{
    private const string StorageProviderKey = "ArchLucid__StorageProvider";

    private readonly string _requiredValue;

    private string? _previousValue;

    private bool _hadPreviousValue;

    private bool _applied;

    internal IntegrationTestStorageProviderEnvironment(string requiredValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requiredValue);

        _requiredValue = requiredValue;

        // Factories that touch Services/CreateClient without the host gate still need env pinned at construction.
        Apply();
    }

    internal void Apply()
    {
        if (_applied)
        {
            Environment.SetEnvironmentVariable(StorageProviderKey, _requiredValue);

            return;
        }

        _previousValue = Environment.GetEnvironmentVariable(StorageProviderKey);
        _hadPreviousValue = _previousValue is not null;
        Environment.SetEnvironmentVariable(StorageProviderKey, _requiredValue);
        _applied = true;
    }

    public void Dispose()
    {
        if (!_applied)
            return;

        if (_hadPreviousValue)
            Environment.SetEnvironmentVariable(StorageProviderKey, _previousValue);
        else
            Environment.SetEnvironmentVariable(StorageProviderKey, null);

        _applied = false;
    }
}
