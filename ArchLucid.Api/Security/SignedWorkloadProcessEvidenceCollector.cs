using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Security;

// Collects process evidence supplied by an independently authenticated workload agent.
// The agent's public key is provisioned separately from the agent's signed envelope.
// No ARM configuration values are interpreted as executing-process observations.
internal sealed class SignedWorkloadProcessEvidenceCollector(
    IConfiguration config, IRuntimeAttestationPublicationAuthority authority, TimeProvider clock)
    : IRuntimeProcessEvidenceCollector
{
    public async Task<RuntimeObservationBatch?> CollectExecutingAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (!RuntimeTelemetryProvisioning.Enabled(config) || !await authority.CanPublishAsync(request, ct)) return null;
        var section = RuntimeTelemetryProvisioning.Scope(config, request).GetSection("Collector");
        string? root = config["SecureNow:RuntimeTelemetry:CollectorRoot"];
        string? encodedKey = section["PublicKeyBase64"];
        string? keyId = section["KeyId"];
        if (!bool.TryParse(section["Enabled"], out bool enabled) || !enabled ||
            string.IsNullOrWhiteSpace(root) || !Path.IsPathFullyQualified(root) ||
            encodedKey is not { Length: > 0 and <= 684 } || string.IsNullOrWhiteSpace(keyId) ||
            keyId.Length > 128 || !keyId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.'))
            return null;
        try
        {
            var path = Path.Combine(Path.GetFullPath(root), RuntimeTelemetryProvisioning.ScopeKey(request) + ".json");
            if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(path)) return null;
            await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read,
                8192, FileOptions.Asynchronous | FileOptions.SequentialScan);
            if (stream.Length is <= 0 or > 1500000) return null;
            using var buffer = new MemoryStream();
            byte[] chunk = new byte[8192];
            int count;
            while ((count = await stream.ReadAsync(chunk.AsMemory(), ct)) != 0)
            {
                if (buffer.Length + count > 1500000) return null;
                buffer.Write(chunk, 0, count);
            }
            if (!RuntimeTelemetrySpoolPath.IsRegularFileUnderPlainDirectories(path)) return null;
            var envelope = JsonSerializer.Deserialize<SignedRuntimeObservationEnvelope>(buffer.ToArray());
            if (envelope is null || !string.Equals(envelope.KeyId, keyId, StringComparison.Ordinal) ||
                envelope.Payload is not { Length: > 0 and <= 1048576 } ||
                envelope.Signature is not { Length: 64 }) return null;
            var publicKey = Convert.FromBase64String(encodedKey);
            if (publicKey.Length is <= 0 or > 512) return null;
            using var verifier = ECDsa.Create();
            verifier.ImportSubjectPublicKeyInfo(publicKey, out int consumed);
            if (consumed != publicKey.Length ||
                verifier.ExportParameters(false).Curve.Oid.Value != "1.2.840.10045.3.1.7" ||
                !verifier.VerifyData(envelope.Payload, envelope.Signature, HashAlgorithmName.SHA256,
                    DSASignatureFormat.IeeeP1363FixedFieldConcatenation)) return null;
            var attestation = JsonSerializer.Deserialize<RuntimeObservationAttestation>(envelope.Payload);
            var now = clock.GetUtcNow();
            if (attestation is not { SchemaVersion: 1, Batch: not null } ||
                attestation.Batch.Scope != request || attestation.IssuedAt > now ||
                attestation.ExpiresAt <= now || attestation.ExpiresAt <= attestation.IssuedAt ||
                attestation.ExpiresAt - attestation.IssuedAt > TimeSpan.FromMinutes(5) ||
                attestation.Batch.EnumeratedAt > attestation.IssuedAt ||
                now - attestation.Batch.EnumeratedAt > TimeSpan.FromMinutes(5) ||
                attestation.Batch.InstanceIds is not { Count: > 0 and <= 10000 } ||
                attestation.Batch.Observations is not { Count: <= 20000 } ||
                attestation.Batch.InstanceIds.Any(string.IsNullOrWhiteSpace)) return null;
            var ids = new HashSet<string>(attestation.Batch.InstanceIds, StringComparer.Ordinal);
            if (ids.Count != attestation.Batch.InstanceIds.Count ||
                attestation.Batch.Observations.Any(o => o is null || !ids.Contains(o.InstanceId) ||
                    string.IsNullOrWhiteSpace(o.Version) || o.ObservedAt < attestation.Batch.EnumeratedAt ||
                    o.ObservedAt > attestation.IssuedAt) ||
                (attestation.Batch.Complete && !ids.SetEquals(attestation.Batch.Observations.Select(o => o.InstanceId))))
                return null;
            if (!await authority.CanPublishAsync(request, ct) ||
                !bool.TryParse(section["Enabled"], out enabled) || !enabled ||
                !string.Equals(section["KeyId"], keyId, StringComparison.Ordinal) ||
                !string.Equals(section["PublicKeyBase64"], encodedKey, StringComparison.Ordinal) ||
                !string.Equals(config["SecureNow:RuntimeTelemetry:CollectorRoot"], root, StringComparison.Ordinal) ||
                attestation.ExpiresAt <= clock.GetUtcNow()) return null;
            ct.ThrowIfCancellationRequested();
            return attestation.Batch with { EvidenceReference = "workload-attestation:sha256:" +
                Convert.ToHexString(SHA256.HashData(envelope.Payload)) };
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException
            or CryptographicException or ArgumentException or FormatException)
        { return null; }
    }
}
