using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SignedWorkloadProcessEvidenceCollectorTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(),
        Guid.NewGuid(), "resource", "generation", "php");

    [Fact]
    public async Task Accepts_only_verified_scope_and_derives_provenance()
    {
        using var fixture = new Fixture();
        var envelope = fixture.Write(Attestation());
        var batch = await fixture.Collect();
        Assert.NotNull(batch);
        Assert.Equal(Request, batch.Scope);
        Assert.Equal("workload-attestation:sha256:" + Convert.ToHexString(SHA256.HashData(envelope.Payload)),
            batch.EvidenceReference);
        Assert.Null(await fixture.Collect(Request with { ProjectId = Guid.NewGuid() }));
    }

    [Fact]
    public async Task Rejects_foreign_stale_and_incomplete_attestations()
    {
        using var fixture = new Fixture();
        var valid = Attestation();
        foreach (var invalid in new[]
        {
            valid with { Batch = valid.Batch with { Scope = Request with { TenantId = Guid.NewGuid() } } },
            valid with { Batch = valid.Batch with { Scope = Request with { DeploymentGeneration = "other" } } },
            valid with { ExpiresAt = Now },
            valid with { Batch = valid.Batch with { InstanceIds = ["one", "two"] } },
            valid with { Batch = valid.Batch with { InstanceIds = ["one", "one"] } },
            valid with { Batch = valid.Batch with { Observations = [new("other", "8.4.2", Now.AddMinutes(-1))] } }
        })
        {
            fixture.Write(invalid);
            Assert.Null(await fixture.Collect());
        }
    }

    [Fact]
    public async Task Rejects_tampering_and_revoked_publication()
    {
        using var fixture = new Fixture();
        var envelope = fixture.Write(Attestation());
        fixture.WriteEnvelope(envelope with { Signature = new byte[64] });
        Assert.Null(await fixture.Collect());
        fixture.Write(Attestation());
        Assert.Null(await fixture.Collect(authority: new Authority(false)));
        Assert.Null(await fixture.Collect(authority: new Authority(true, false)));
    }

    private static RuntimeObservationAttestation Attestation() => new(1, Now.AddMinutes(-1), Now.AddMinutes(2),
        new RuntimeObservationBatch(Request, Now.AddMinutes(-2), true, ["one"],
            [new("one", "8.4.2", Now.AddMinutes(-1))], "untrusted"));

    private sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Authority(bool initial = true, bool subsequent = true) : IRuntimeAttestationPublicationAuthority
    {
        private int calls;
        public Task<bool> CanPublishAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(calls++ == 0 ? initial : subsequent);
    }
    private sealed class Fixture : IDisposable
    {
        private readonly ECDsa key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        private readonly string root = Directory.CreateTempSubdirectory("runtime-collector-").FullName;
        private string FilePath => Path.Combine(root, RuntimeTelemetryProvisioning.ScopeKey(Request) + ".json");
        public SignedRuntimeObservationEnvelope Write(RuntimeObservationAttestation attestation)
        {
            byte[] payload = JsonSerializer.SerializeToUtf8Bytes(attestation);
            var envelope = new SignedRuntimeObservationEnvelope("agent-key", payload,
                key.SignData(payload, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation));
            WriteEnvelope(envelope);
            return envelope;
        }
        public void WriteEnvelope(SignedRuntimeObservationEnvelope envelope) =>
            File.WriteAllBytes(FilePath, JsonSerializer.SerializeToUtf8Bytes(envelope));
        public Task<RuntimeObservationBatch?> Collect(RuntimeObservationRequest? request = null, Authority? authority = null)
        {
            string prefix = "SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(Request) + ":Collector";
            IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SecureNow:RuntimeTelemetry:Enabled"] = "true",
                ["SecureNow:RuntimeTelemetry:CollectorRoot"] = root,
                [prefix + ":Enabled"] = "true",
                [prefix + ":KeyId"] = "agent-key",
                [prefix + ":PublicKeyBase64"] = Convert.ToBase64String(key.ExportSubjectPublicKeyInfo()),
            }).Build();
            return new SignedWorkloadProcessEvidenceCollector(config, authority ?? new Authority(), new Clock())
                .CollectExecutingAsync(request ?? Request, CancellationToken.None);
        }
        public void Dispose()
        {
            key.Dispose();
            Directory.Delete(root, recursive: true);
        }
    }
}
