using System.Security.Cryptography;
using System.Text.Json;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record SignedRuntimeObservationEnvelope(
    string KeyId, byte[] Payload, byte[] Signature);

internal sealed record RuntimeObservationAttestation(
    int SchemaVersion, DateTimeOffset IssuedAt, DateTimeOffset ExpiresAt,
    RuntimeObservationBatch Batch);

/// <summary>
/// Read-only, server-owned transport. Both operations must authorize the complete request
/// against current tenant/workspace/project/resource grants. Keys must be provisioned
/// independently of the telemetry producer payload; never trust an embedded public key.
/// No implementation may execute commands on a workload to fulfill these reads.
/// </summary>
internal interface IScopedRuntimeTelemetryReader
{
    Task<SignedRuntimeObservationEnvelope?> ReadAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken);

    Task<byte[]?> ReadAuthorizedSigningKeyAsync(
        RuntimeObservationRequest request, string keyId, CancellationToken cancellationToken);
}

/// <summary>
/// Verifies a signed, short-lived observation batch from an authorized read-only telemetry
/// transport. This is a concrete verification source, not a live collector or a DI registration.
/// A trusted producer must attest actual process versions and instance enumeration.
/// </summary>
internal sealed class SignedRuntimeObservationSource(
    IScopedRuntimeTelemetryReader reader, TimeProvider clock, IRuntimeAttestationReplayGuard replayGuard) : IAuthorizedRuntimeObservationSource
{
    private const int MaximumPayloadBytes = 1024 * 1024;
    private static readonly TimeSpan MaximumLifetime = TimeSpan.FromMinutes(15);

    public async Task<RuntimeObservationBatch?> ReadAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            SignedRuntimeObservationEnvelope? envelope = await reader.ReadAsync(request, cancellationToken);
            if (envelope is null || string.IsNullOrWhiteSpace(envelope.KeyId)
                || envelope.KeyId.Length > 128
                || envelope.Payload is not { Length: > 0 and <= MaximumPayloadBytes }
                || envelope.Signature is not { Length: 64 })
            {
                return null;
            }

            // Snapshot mutable arrays before validation to avoid verifying different bytes
            // from those subsequently parsed.
            byte[] payload = envelope.Payload.ToArray();
            byte[] signature = envelope.Signature.ToArray();
            byte[]? publicKey = await reader.ReadAuthorizedSigningKeyAsync(
                request, envelope.KeyId, cancellationToken);
            cancellationToken.ThrowIfCancellationRequested();
            if (publicKey is not { Length: > 0 and <= 512 })
            {
                return null;
            }

            using ECDsa verifier = ECDsa.Create();
            verifier.ImportSubjectPublicKeyInfo(publicKey, out int bytesRead);
            if (bytesRead != publicKey.Length
                || verifier.ExportParameters(false).Curve.Oid.Value != "1.2.840.10045.3.1.7"
                || !verifier.VerifyData(payload, signature, HashAlgorithmName.SHA256,
                    DSASignatureFormat.IeeeP1363FixedFieldConcatenation))
            {
                return null;
            }

            RuntimeObservationAttestation? attestation =
                JsonSerializer.Deserialize<RuntimeObservationAttestation>(payload);
            DateTimeOffset now = clock.GetUtcNow();
            if (attestation is null || attestation.SchemaVersion != 1
                || attestation.Batch is not { } batch || batch.Scope != request
                || attestation.IssuedAt > now || attestation.ExpiresAt <= now
                || attestation.ExpiresAt <= attestation.IssuedAt
                || attestation.ExpiresAt - attestation.IssuedAt > MaximumLifetime
                || batch.EnumeratedAt > attestation.IssuedAt
                || batch.EnumeratedAt < attestation.IssuedAt - MaximumLifetime
                || batch.Observations is null
                || batch.Observations.Any(item => item is null
                    || item.ObservedAt < batch.EnumeratedAt || item.ObservedAt > attestation.IssuedAt))
            {
                return null;
            }

            string digest = Convert.ToHexString(SHA256.HashData(payload));
            cancellationToken.ThrowIfCancellationRequested();
            if (!replayGuard.TryAccept(request, attestation.IssuedAt, batch.EnumeratedAt,
                    attestation.ExpiresAt, digest, now)) return null;

            // Cite the verified bytes, not a caller-provided URL or unverifiable claim.
            return batch with
            {
                EvidenceReference = $"runtime-attestation:sha256:{digest}",
            };
        }
        catch (Exception exception) when (exception is CryptographicException
            or JsonException or UnauthorizedAccessException or HttpRequestException)
        {
            // Permission failure, malformed proof or unavailable transport cannot establish
            // protection. Cancellation and unexpected defects still propagate.
            return null;
        }
    }
}
