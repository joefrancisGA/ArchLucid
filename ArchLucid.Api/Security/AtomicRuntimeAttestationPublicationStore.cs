using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

/// <summary>Atomic publication to an administrator-controlled local filesystem.
/// Requires trusted producer identity and independent signing-key provisioning.
/// No caller-controlled path, in-place write or unverified signature is accepted.
/// Filesystem ACLs remain mandatory; this is not a sandbox for hostile writers.</summary>
internal sealed class AtomicRuntimeAttestationPublicationStore(
    IConfiguration config, IRuntimeAttestationPublicationAuthority authority,
    IRuntimeTelemetryTrustRegistry trust, TimeProvider clock)
    : IRuntimeAttestationPublicationStore
{
    public async Task<bool> PublishAsync(RuntimeObservationRequest request,
        SignedRuntimeObservationEnvelope envelope, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (!RuntimeTelemetryProvisioning.Enabled(config) ||
            !await authority.CanPublishAsync(request, ct) ||
            envelope.Payload is not { Length: > 0 and <= 1048576 } ||
            envelope.Signature is not { Length: 64 } ||
            string.IsNullOrWhiteSpace(envelope.KeyId) || envelope.KeyId.Length > 128 ||
            !envelope.KeyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.'))
            return false;

        string? temporary = null;
        try
        {
            var payload = envelope.Payload.ToArray();
            var signature = envelope.Signature.ToArray();
            var key = await trust.ReadCurrentKeyAsync(request, envelope.KeyId, ct);
            if (key is not { Length: > 0 and <= 512 }) return false;
            using var verifier = ECDsa.Create();
            verifier.ImportSubjectPublicKeyInfo(key, out int consumed);
            if (consumed != key.Length ||
                verifier.ExportParameters(false).Curve.Oid.Value != "1.2.840.10045.3.1.7" ||
                !verifier.VerifyData(payload, signature, HashAlgorithmName.SHA256,
                    DSASignatureFormat.IeeeP1363FixedFieldConcatenation))
                return false;

            var attestation = JsonSerializer.Deserialize<RuntimeObservationAttestation>(payload);
            if (!Current(attestation, request)) return false;
            string? root = config["SecureNow:RuntimeTelemetry:SpoolRoot"];
            if (string.IsNullOrWhiteSpace(root) || !Path.IsPathFullyQualified(root)) return false;
            root = Path.GetFullPath(root);
            for (DirectoryInfo? directory = new(root); directory is not null; directory = directory.Parent)
            {
                var flags = directory.Attributes;
                if ((flags & FileAttributes.Directory) == 0 ||
                    (flags & FileAttributes.ReparsePoint) != 0) return false;
            }

            var destination = Path.Combine(root, RuntimeTelemetryProvisioning.ScopeKey(request) + ".json");
            // Exclusive per-scope lock coordinates cooperating publishers on this filesystem.
            // The lock file is retained; deleting it could split concurrent lock ownership.
            var lockPath = destination + ".publish.lock";
            if (File.Exists(lockPath) && !RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(lockPath))
                return false;
            await using var gate = new FileStream(lockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite,
                FileShare.None, 1, FileOptions.None);
            if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(lockPath)) return false;

            if (File.Exists(destination))
            {
                if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(destination)) return false;
                await using var previousStream = new FileStream(destination, FileMode.Open, FileAccess.Read,
                    FileShare.Read, 8192, FileOptions.Asynchronous);
                if (previousStream.Length is <= 0 or > 1500000) return false;
                var previousBytes = new byte[(int)previousStream.Length];
                await previousStream.ReadExactlyAsync(previousBytes.AsMemory(), ct);
                if (previousStream.ReadByte() != -1) return false;
                var previous = JsonSerializer.Deserialize<SignedRuntimeObservationEnvelope>(previousBytes);
                if (previous?.Payload is not { Length: > 0 and <= 1048576 } ||
                    previous.Signature is not { Length: 64 }) return false;
                var baseline = JsonSerializer.Deserialize<RuntimeObservationAttestation>(previous.Payload);
                if (baseline is null || baseline.SchemaVersion != 1 || baseline.Batch?.Scope != request ||
                    attestation!.IssuedAt < baseline.IssuedAt ||
                    attestation.Batch.EnumeratedAt < baseline.Batch.EnumeratedAt) return false;
                if (attestation.IssuedAt == baseline.IssuedAt)
                    return CryptographicOperations.FixedTimeEquals(payload, previous.Payload);
            }

            var bytes = JsonSerializer.SerializeToUtf8Bytes(new SignedRuntimeObservationEnvelope(
                envelope.KeyId, payload, signature));
            if (bytes.Length > 1500000) return false;
            temporary = Path.Combine(root, Guid.NewGuid().ToString("N") + ".tmp");
            await using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write,
                FileShare.None, 8192, FileOptions.Asynchronous | FileOptions.WriteThrough))
            {
                await stream.WriteAsync(bytes.AsMemory(), ct);
                await stream.FlushAsync(ct);
                stream.Flush(flushToDisk: true);
            }
            ct.ThrowIfCancellationRequested();
            if (!await authority.CanPublishAsync(request, ct) || !Current(attestation, request) ||
                !RuntimeTelemetryProvisioning.Enabled(config) ||
                !string.Equals(config["SecureNow:RuntimeTelemetry:SpoolRoot"], root, StringComparison.Ordinal) ||
                !RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(temporary))
                return false;
            var currentKey = await trust.ReadCurrentKeyAsync(request, envelope.KeyId, ct);
            if (currentKey is null || !CryptographicOperations.FixedTimeEquals(key, currentKey)) return false;
            ct.ThrowIfCancellationRequested();
            File.Move(temporary, destination, overwrite: true);
            temporary = null;
            return true;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or
            JsonException or CryptographicException or ArgumentException)
        {
            return false;
        }
        finally
        {
            if (temporary is not null)
            {
                try { File.Delete(temporary); }
                catch (IOException) { }
                catch (UnauthorizedAccessException) { }
            }
        }
    }

    private bool Current(RuntimeObservationAttestation? attestation, RuntimeObservationRequest request)
    {
        var now = clock.GetUtcNow();
        return attestation is { SchemaVersion: 1, Batch: not null } &&
            attestation.Batch.Scope == request && attestation.IssuedAt <= now &&
            attestation.ExpiresAt > now && attestation.ExpiresAt > attestation.IssuedAt &&
            attestation.ExpiresAt - attestation.IssuedAt <= TimeSpan.FromMinutes(15) &&
            attestation.Batch.EnumeratedAt <= attestation.IssuedAt;
    }
}
