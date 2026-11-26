namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Server-owned authority; implementations must check the current caller's
/// resource grant, including deployment generation and runtime family.</summary>
internal interface IRuntimeTelemetryReadAuthority
{
    Task<bool> CanReadAsync(RuntimeObservationRequest request, CancellationToken cancellationToken);
}

/// <summary>Read-only telemetry storage, keyed by the complete request.
/// Implementations must not fall back to a resource-only or tenant-only lookup.</summary>
internal interface IRuntimeTelemetryEnvelopeStore
{
    Task<SignedRuntimeObservationEnvelope?> ReadExactAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken);
}

/// <summary>Independently provisioned trust registry. A successful lookup must
/// establish a current, non-revoked key grant for the exact request and key ID.</summary>
internal interface IRuntimeTelemetryTrustRegistry
{
    Task<byte[]?> ReadCurrentKeyAsync(RuntimeObservationRequest request, string keyId,
        CancellationToken cancellationToken);
}

/// <summary>Concrete authorization boundary shared by the signed telemetry verifier.
/// Backends are server-selected; no caller URL, embedded key or remote command is accepted.</summary>
internal sealed class ScopedRuntimeTelemetryReader(
    IRuntimeTelemetryReadAuthority authority,
    IRuntimeTelemetryEnvelopeStore store,
    IRuntimeTelemetryTrustRegistry trustRegistry) : IScopedRuntimeTelemetryReader
{
    public async Task<SignedRuntimeObservationEnvelope?> ReadAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        if (!await IsAuthorizedAsync(request, cancellationToken)) return null;
        var envelope = await store.ReadExactAsync(request, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        if (envelope is null || envelope.Payload is not { Length: > 0 and <= 1048576 }
            || envelope.Signature is not { Length: 64 } || !ValidKeyId(envelope.KeyId))
            return null;
        // Recheck grants after the read; do not release data after a known revocation.
        if (!await IsAuthorizedAsync(request, cancellationToken)) return null;
        return new(envelope.KeyId, envelope.Payload.ToArray(), envelope.Signature.ToArray());
    }

    public async Task<byte[]?> ReadAuthorizedSigningKeyAsync(
        RuntimeObservationRequest request, string keyId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!ValidKeyId(keyId) || !await IsAuthorizedAsync(request, cancellationToken)) return null;
        var key = await trustRegistry.ReadCurrentKeyAsync(request, keyId, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        if (key is not { Length: > 0 and <= 512 }
            || !await IsAuthorizedAsync(request, cancellationToken)) return null;
        return key.ToArray();
    }

    private async Task<bool> IsAuthorizedAsync(RuntimeObservationRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);
        if (request.TenantId == Guid.Empty || request.WorkspaceId == Guid.Empty
            || request.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(request.ResourceId)
            || string.IsNullOrWhiteSpace(request.DeploymentGeneration)
            || string.IsNullOrWhiteSpace(request.RuntimeFamily)) return false;
        bool allowed = await authority.CanReadAsync(request, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        return allowed;
    }

    private static bool ValidKeyId(string? keyId) =>
        !string.IsNullOrWhiteSpace(keyId) && keyId.Length <= 128
        && keyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.');
}
