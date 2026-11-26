using System.Security.Cryptography;
using System.Text.Json;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Trusted server-side producer boundary. No caller-supplied signing key or batch.
internal interface IAuthorizedRuntimeAttestationProducer
{
    Task<RuntimeObservationBatch?> CollectAsync(RuntimeObservationRequest request, CancellationToken cancellationToken);
    Task<SignedRuntimeObservationEnvelope?> SignAsync(RuntimeObservationRequest request,
        byte[] payload, CancellationToken cancellationToken);
}

internal interface IRuntimeAttestationPublicationStore
{
    Task<bool> PublishAsync(RuntimeObservationRequest request, SignedRuntimeObservationEnvelope envelope,
        CancellationToken cancellationToken);
}

internal sealed class RuntimeAttestationPublisher(
    IAuthorizedRuntimeAttestationProducer producer, IRuntimeTelemetryReadAuthority authority,
    IRuntimeAttestationPublicationStore store, TimeProvider clock)
{
    public async Task<bool> PublishAsync(RuntimeObservationRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (!await authority.CanReadAsync(request, ct)) return false;
        var batch = await producer.CollectAsync(request, ct);
        var now = clock.GetUtcNow();
        if (batch is null || batch.Scope != request || batch.InstanceIds is null ||
            batch.Observations is null || batch.InstanceIds.Count == 0 ||
            batch.EnumeratedAt > now || now - batch.EnumeratedAt > TimeSpan.FromMinutes(5) ||
            batch.InstanceIds.Any(string.IsNullOrWhiteSpace)) return false;
        var instances = new HashSet<string>(batch.InstanceIds, StringComparer.Ordinal);
        if (instances.Count != batch.InstanceIds.Count ||
            batch.Observations.Any(o => o is null || !instances.Contains(o.InstanceId) ||
                string.IsNullOrWhiteSpace(o.Version) || o.ObservedAt < batch.EnumeratedAt || o.ObservedAt > now))
            return false;
        if (batch.Complete && !instances.SetEquals(batch.Observations.Select(o => o.InstanceId)))
            return false;
        // Sign exactly the serialized evidence, not caller-provided provenance.
        var payload = JsonSerializer.SerializeToUtf8Bytes(new RuntimeObservationAttestation(
            1, now, now.AddMinutes(5), batch with { EvidenceReference = string.Empty }));
        if (payload.Length > 1024 * 1024) return false;
        var expected = payload.ToArray();
        var envelope = await producer.SignAsync(request, payload, ct);
        if (envelope is null || envelope.Payload is null ||
            !CryptographicOperations.FixedTimeEquals(expected, envelope.Payload) ||
            envelope.Signature is not { Length: 64 } || string.IsNullOrWhiteSpace(envelope.KeyId))
            return false;
        ct.ThrowIfCancellationRequested();
        if (!await authority.CanReadAsync(request, ct)) return false;
        return await store.PublishAsync(request, envelope, ct);
    }
}
