namespace ArchLucid.Api.Tests;

/// <summary>
///     Saves and restores <c>ArtifactLargePayload__BlobProvider</c> for one integration host lifetime.
///     <see cref="Program" /> loads <c>appsettings.Advanced.json</c> (BlobProvider=None) after factory in-memory
///     configuration, so process env must win via <c>AddEnvironmentVariables()</c> for bulk evidence uploads.
/// </summary>
internal sealed class IntegrationTestArtifactBlobEnvironment : IDisposable
{
    private const string BlobProviderKey = "ArtifactLargePayload__BlobProvider";

    private readonly string? _previousValue;

    private readonly bool _hadPreviousValue;

    internal IntegrationTestArtifactBlobEnvironment(string requiredValue = "Local")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requiredValue);

        _previousValue = Environment.GetEnvironmentVariable(BlobProviderKey);
        _hadPreviousValue = _previousValue is not null;

        Environment.SetEnvironmentVariable(BlobProviderKey, requiredValue);
    }

    public void Dispose()
    {
        if (_hadPreviousValue)
            Environment.SetEnvironmentVariable(BlobProviderKey, _previousValue);
        else
            Environment.SetEnvironmentVariable(BlobProviderKey, null);
    }
}
