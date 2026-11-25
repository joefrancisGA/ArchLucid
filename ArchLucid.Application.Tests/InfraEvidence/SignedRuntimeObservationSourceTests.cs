using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SignedRuntimeObservationSourceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app",
        "deployment-2", "Java");

    private static RuntimeObservationAttestation Attestation() => new(
        1, Now.AddMinutes(-1), Now.AddMinutes(5),
        new RuntimeObservationBatch(Request, Now.AddMinutes(-3), true, ["worker-1"],
            [new("worker-1", "17.0.21.1", Now.AddMinutes(-2))], "untrusted-reference"));

    private static SignedRuntimeObservationEnvelope Sign(
        ECDsa key, RuntimeObservationAttestation attestation)
    {
        byte[] payload = JsonSerializer.SerializeToUtf8Bytes(attestation);
        return new("key-1", payload, key.SignData(payload, HashAlgorithmName.SHA256,
            DSASignatureFormat.IeeeP1363FixedFieldConcatenation));
    }

    [Fact]
    public async Task Accepts_verified_scoped_attestation_and_derives_evidence_reference()
    {
        using ECDsa key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        SignedRuntimeObservationEnvelope envelope = Sign(key, Attestation());
        Reader reader = new(envelope, key.ExportSubjectPublicKeyInfo());
        RuntimeObservationBatch? batch = await Read(reader);
        Assert.NotNull(batch);
        Assert.Equal(Request, batch.Scope);
        Assert.Equal("runtime-attestation:sha256:" +
            Convert.ToHexString(SHA256.HashData(envelope.Payload)), batch.EvidenceReference);
    }

    [Fact]
    public async Task Rejects_tampering_wrong_key_and_unprovisioned_key()
    {
        using ECDsa key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        using ECDsa wrongKey = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        SignedRuntimeObservationEnvelope envelope = Sign(key, Attestation());
        byte[] publicKey = key.ExportSubjectPublicKeyInfo();
        Assert.Null(await Read(new Reader(envelope, wrongKey.ExportSubjectPublicKeyInfo())));
        Assert.Null(await Read(new Reader(envelope, null)));
        byte[] modified = envelope.Payload.ToArray();
        modified[^1] ^= 1;
        Assert.Null(await Read(new Reader(envelope with { Payload = modified }, publicKey)));
        Assert.Null(await Read(new Reader(envelope with { Signature = new byte[64] }, publicKey)));
    }

    [Fact]
    public async Task Rejects_valid_signatures_for_foreign_or_stale_evidence()
    {
        using ECDsa key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        RuntimeObservationAttestation original = Attestation();
        RuntimeObservationAttestation[] invalid =
        [
            original with { SchemaVersion = 2 },
            original with { ExpiresAt = Now },
            original with { IssuedAt = Now.AddMinutes(1) },
            original with { ExpiresAt = Now.AddHours(1) },
            original with { Batch = original.Batch with
                { Scope = Request with { TenantId = Guid.NewGuid() } } },
            original with { Batch = original.Batch with
                { Scope = Request with { WorkspaceId = Guid.NewGuid() } } },
            original with { Batch = original.Batch with
                { Scope = Request with { ProjectId = Guid.NewGuid() } } },
            original with { Batch = original.Batch with
                { Scope = Request with { ResourceId = Request.ResourceId + "-other" } } },
            original with { Batch = original.Batch with
                { Scope = Request with { DeploymentGeneration = "deployment-1" } } },
            original with { Batch = original.Batch with { EnumeratedAt = Now.AddHours(-1) } },
            original with { Batch = original.Batch with
                { Observations = [new("worker-1", "17.0.21.1", Now)] } },
        ];
        foreach (RuntimeObservationAttestation attestation in invalid)
        {
            Assert.Null(await Read(new Reader(Sign(key, attestation), key.ExportSubjectPublicKeyInfo())));
        }
    }

    [Fact]
    public async Task Missing_or_forbidden_telemetry_does_not_establish_protection()
    {
        Assert.Null(await Read(new Reader(null, null)));
        Assert.Null(await Read(new Reader(null, null, forbidden: true)));
    }

    private static Task<RuntimeObservationBatch?> Read(Reader reader) =>
        new SignedRuntimeObservationSource(reader, new FixedClock()).ReadAsync(Request, CancellationToken.None);

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class Reader(
        SignedRuntimeObservationEnvelope? envelope, byte[]? key, bool forbidden = false)
        : IScopedRuntimeTelemetryReader
    {
        public Task<SignedRuntimeObservationEnvelope?> ReadAsync(
            RuntimeObservationRequest request, CancellationToken cancellationToken) =>
            forbidden
                ? Task.FromException<SignedRuntimeObservationEnvelope?>(new UnauthorizedAccessException())
                : Task.FromResult(envelope);

        public Task<byte[]?> ReadAuthorizedSigningKeyAsync(
            RuntimeObservationRequest request, string keyId, CancellationToken cancellationToken) =>
            Task.FromResult(key);
    }
}
