using ArchLucid.Persistence.BlobStore;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.BlobStore;

internal sealed class StubArtifactLargePayloadOptionsMonitor(ArtifactLargePayloadOptions value)
    : IOptionsMonitor<ArtifactLargePayloadOptions>
{
    private readonly ArtifactLargePayloadOptions _value = value ?? throw new ArgumentNullException(nameof(value));

    public ArtifactLargePayloadOptions CurrentValue => _value;

    public ArtifactLargePayloadOptions Get(string? name) => _value;

    public IDisposable OnChange(Action<ArtifactLargePayloadOptions, string?> listener) => new StubDisposableInternal();

    private sealed class StubDisposableInternal : IDisposable
    {
        public void Dispose()
        {
        }
    }
}
