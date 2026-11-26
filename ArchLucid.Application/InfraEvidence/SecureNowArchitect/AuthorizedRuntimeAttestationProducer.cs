using System.Security.Cryptography;
using System.Text.Json;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// The host must supply a trusted process-level collector, not an ARM configuration
// reader or caller-uploaded evidence. Signing is delegated to an independently
// provisioned key service; private key material never enters this adapter.
internal interface IRuntimeProcessEvidenceCollector
{
    Task<RuntimeObservationBatch?> CollectExecutingAsync(RuntimeObservationRequest request, CancellationToken ct);
}

internal interface IScopedRuntimeDigestSigner
{
    Task<(string KeyId, byte[] Signature)?> SignSha256Async(
        RuntimeObservationRequest request, byte[] digest, CancellationToken ct);
}

internal sealed class AuthorizedRuntimeAttestationProducer(
    IRuntimeProcessEvidenceCollector collector, IScopedRuntimeDigestSigner signer,
    IRuntimeAttestationPublicationAuthority authority, TimeProvider clock)
    : IAuthorizedRuntimeAttestationProducer
{
    public async Task<RuntimeObservationBatch?> CollectAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (!await authority.CanPublishAsync(request, ct)) return null;
        var batch = await collector.CollectExecutingAsync(request, ct);
        if (batch is null || batch.Scope != request || !await authority.CanPublishAsync(request, ct))
            return null;
        return batch;
    }

    public async Task<SignedRuntimeObservationEnvelope?> SignAsync(
        RuntimeObservationRequest request, byte[] payload, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (payload is not { Length: > 0 and <= 1048576 } ||
            !await authority.CanPublishAsync(request, ct)) return null;
        var bytes = payload.ToArray();
        try
        {
            var attestation = JsonSerializer.Deserialize<RuntimeObservationAttestation>(bytes);
            var now = clock.GetUtcNow();
            if (attestation is not { SchemaVersion: 1, Batch: not null } ||
                attestation.Batch.Scope != request || attestation.IssuedAt > now ||
                attestation.ExpiresAt <= now || attestation.ExpiresAt <= attestation.IssuedAt ||
                attestation.ExpiresAt - attestation.IssuedAt > TimeSpan.FromMinutes(5))
                return null;
            var signed = await signer.SignSha256Async(request, SHA256.HashData(bytes), ct);
            if (signed is not { } result || result.Signature is not { Length: 64 } ||
                string.IsNullOrWhiteSpace(result.KeyId) || result.KeyId.Length > 128 ||
                !result.KeyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.') ||
                !await authority.CanPublishAsync(request, ct)) return null;
            ct.ThrowIfCancellationRequested();
            return new(result.KeyId, bytes, result.Signature.ToArray());
        }
        catch (JsonException) { return null; }
        catch (CryptographicException) { return null; }
        catch (UnauthorizedAccessException) { return null; }
    }
}
