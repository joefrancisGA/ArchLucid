using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ScopedRuntimeTelemetryReaderTests
{
    private static readonly RuntimeObservationRequest Request =
        new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "/app/slots/blue", "deployment-1", "php");

    private sealed class Backend : IRuntimeTelemetryReadAuthority, IRuntimeTelemetryEnvelopeStore,
        IRuntimeTelemetryTrustRegistry
    {
        public bool Allowed = true;
        public bool RevokeAfterRead;
        public int EnvelopeReads;
        public int KeyReads;
        public readonly byte[] Payload = [1, 2, 3];
        public readonly byte[] Key = [4, 5, 6];

        public Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken cancellationToken) =>
            Task.FromResult(Allowed && request == Request);

        public Task<SignedRuntimeObservationEnvelope?> ReadExactAsync(
            RuntimeObservationRequest request, CancellationToken cancellationToken)
        {
            Assert.Equal(Request, request);
            EnvelopeReads++;
            if (RevokeAfterRead) Allowed = false;
            return Task.FromResult<SignedRuntimeObservationEnvelope?>(new("key-1", Payload, new byte[64]));
        }

        public Task<byte[]?> ReadCurrentKeyAsync(RuntimeObservationRequest request, string keyId,
            CancellationToken cancellationToken)
        {
            Assert.Equal(Request, request);
            KeyReads++;
            if (RevokeAfterRead) Allowed = false;
            return Task.FromResult<byte[]?>(keyId == "key-1" ? Key : null);
        }

        public ScopedRuntimeTelemetryReader Reader() => new(this, this, this);
    }

    [Fact]
    public async Task AuthorizedReadsReturnDefensiveCopies()
    {
        var backend = new Backend();
        var reader = backend.Reader();
        var envelope = await reader.ReadAsync(Request, default);
        var key = await reader.ReadAuthorizedSigningKeyAsync(Request, "key-1", default);
        Assert.NotNull(envelope);
        Assert.NotNull(key);
        Assert.Equal(backend.Payload, envelope.Payload);
        Assert.Equal(backend.Key, key);
        Assert.NotSame(backend.Payload, envelope.Payload);
        Assert.NotSame(backend.Key, key);
    }

    [Fact]
    public async Task DeniedOrForeignScopeNeverReadsEitherBackend()
    {
        var backend = new Backend();
        var reader = backend.Reader();
        foreach (var request in new[] {
            Request with { TenantId = Guid.NewGuid() },
            Request with { WorkspaceId = Guid.NewGuid() },
            Request with { ProjectId = Guid.NewGuid() },
            Request with { ResourceId = "/other" },
            Request with { DeploymentGeneration = "other" },
            Request with { RuntimeFamily = "other" },
            Request with { TenantId = Guid.Empty } })
        {
            Assert.Null(await reader.ReadAsync(request, default));
            Assert.Null(await reader.ReadAuthorizedSigningKeyAsync(request, "key-1", default));
        }
        backend.Allowed = false;
        Assert.Null(await reader.ReadAsync(Request, default));
        Assert.Null(await reader.ReadAuthorizedSigningKeyAsync(Request, "key-1", default));
        Assert.Equal(0, backend.EnvelopeReads);
        Assert.Equal(0, backend.KeyReads);
    }

    [Fact]
    public async Task RevocationDuringReadSuppressesData()
    {
        var backend = new Backend { RevokeAfterRead = true };
        Assert.Null(await backend.Reader().ReadAsync(Request, default));
        backend.Allowed = true;
        Assert.Null(await backend.Reader().ReadAuthorizedSigningKeyAsync(Request, "key-1", default));
    }

    [Theory]
    [InlineData("")]
    [InlineData("../key")]
    [InlineData("https://example.org/key")]
    public async Task InvalidKeyIdentifierNeverReachesRegistry(string keyId)
    {
        var backend = new Backend();
        Assert.Null(await backend.Reader().ReadAuthorizedSigningKeyAsync(Request, keyId, default));
        Assert.Equal(0, backend.KeyReads);
    }

    [Fact]
    public async Task UnknownKeyRemainsUnavailable()
    {
        var backend = new Backend();
        Assert.Null(await backend.Reader().ReadAuthorizedSigningKeyAsync(Request, "unknown", default));
    }

    [Fact]
    public async Task CancellationPropagatesBeforeReading()
    {
        var backend = new Backend();
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => backend.Reader().ReadAsync(Request, cts.Token));
        Assert.Equal(0, backend.EnvelopeReads);
    }
}
