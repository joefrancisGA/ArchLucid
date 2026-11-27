using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimeSecurityExecutionServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "php");
    private static ScopeContext Scope() => new()
    {
        TenantId = Request.TenantId, WorkspaceId = Request.WorkspaceId, ProjectId = Request.ProjectId
    };

    [Fact]
    public async Task Verified_publication_generates_vulnerability_and_lifecycle_evidence()
    {
        using var fixture = new Fixture();
        var result = await fixture.Executor.ExecuteAsync(Scope(), Request, TimeSpan.FromMinutes(5), default);
        Assert.True(result.Published);
        Assert.True(result.CatalogCurrent);
        Assert.True(result.Persisted);
        Assert.Equal(2, result.Candidates);
        var assessment = Assert.Single(fixture.Journal.Records);
        Assert.Equal("CVE-fixture", Assert.Single(assessment.Findings).AdvisoryId);
        Assert.Equal("8.4", Assert.Single(assessment.LifecycleFindings).ReleaseLine);
        Assert.StartsWith("runtime-attestation:sha256:", assessment.Findings[0].RuntimeEvidenceReference);
    }

    [Fact]
    public async Task Failed_publication_never_assesses_or_persists_old_evidence()
    {
        using var fixture = new Fixture();
        fixture.Transport.RejectPublication = true;
        var result = await fixture.Executor.ExecuteAsync(Scope(), Request, TimeSpan.FromMinutes(5), default);
        Assert.False(result.Published);
        Assert.Equal(0, fixture.Catalog.Calls);
        Assert.Empty(fixture.Journal.Records);
    }

    [Fact]
    public async Task Foreign_scope_or_denied_worker_never_collects()
    {
        using var fixture = new Fixture();
        var foreign = new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Request.WorkspaceId, ProjectId = Request.ProjectId };
        Assert.False((await fixture.Executor.ExecuteAsync(foreign, Request, TimeSpan.FromMinutes(5), default)).Published);
        fixture.Authority.Allowed = false;
        Assert.False((await fixture.Executor.ExecuteAsync(Scope(), Request, TimeSpan.FromMinutes(5), default)).Published);
        Assert.Equal(0, fixture.Producer.Calls);
        Assert.Empty(fixture.Journal.Records);
    }

    private sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class Gate : IRuntimeAttestationPublicationAuthority
    {
        public bool Allowed { get; set; } = true;
        public Task<bool> CanPublishAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(Allowed && request == Request);
    }

    private sealed class ProducerFixture(ECDsa key) : IAuthorizedRuntimeAttestationProducer
    {
        public int Calls { get; private set; }
        public Task<RuntimeObservationBatch?> CollectAsync(RuntimeObservationRequest request, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult<RuntimeObservationBatch?>(new(request, Now.AddMinutes(-2), true, ["one"],
                [new RuntimeObservedInstance("one", "8.4.2", Now.AddMinutes(-1))
                    { Vendor = "php", Distribution = "upstream" }], "fixture"));
        }
        public Task<SignedRuntimeObservationEnvelope?> SignAsync(RuntimeObservationRequest request, byte[] payload, CancellationToken ct) =>
            Task.FromResult<SignedRuntimeObservationEnvelope?>(new("fixture-key", payload,
                key.SignData(payload, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation)));
    }

    private sealed class TransportFixture(ECDsa key) : IRuntimeAttestationPublicationStore, IScopedRuntimeTelemetryReader
    {
        private SignedRuntimeObservationEnvelope? envelope;
        public bool RejectPublication { get; set; }
        public Task<bool> PublishAsync(RuntimeObservationRequest request, SignedRuntimeObservationEnvelope value, CancellationToken ct)
        {
            if (RejectPublication) return Task.FromResult(false);
            envelope = value;
            return Task.FromResult(true);
        }
        public Task<SignedRuntimeObservationEnvelope?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(envelope);
        public Task<byte[]?> ReadAuthorizedSigningKeyAsync(RuntimeObservationRequest request, string keyId, CancellationToken ct) =>
            Task.FromResult<byte[]?>(key.ExportSubjectPublicKeyInfo());
    }

    private sealed class CatalogFixture : IVerifiedRuntimeAdvisoryCatalogSource
    {
        public int Calls { get; private set; }
        public Task<VerifiedRuntimeAdvisoryCatalog?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult<VerifiedRuntimeAdvisoryCatalog?>(new("catalog", Now.AddHours(-1), Now.AddHours(1),
                [new("CVE-fixture", "php", "php", "upstream", "8.4.0", "8.4.10", "vendor", Now.AddHours(-2), Now.AddHours(1), [])])
            {
                Lifecycles = [new("php", "php", "upstream", "8.4", Now.AddDays(-1), null,
                    Now.AddHours(-2), Now.AddHours(1), "lifecycle")]
            });
        }
    }

    private sealed class JournalFixture : IRuntimeFindingJournal
    {
        public List<RuntimeCatalogAssessment> Records { get; } = [];
        public Task<bool> AppendAsync(RuntimeObservationRequest request, RuntimeCatalogAssessment assessment, CancellationToken ct)
        {
            Records.Add(assessment);
            return Task.FromResult(true);
        }
    }

    private sealed class Fixture : IDisposable
    {
        private readonly ECDsa key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        public Gate Authority { get; } = new();
        public ProducerFixture Producer { get; }
        public TransportFixture Transport { get; }
        public CatalogFixture Catalog { get; } = new();
        public JournalFixture Journal { get; } = new();
        public RuntimeSecurityExecutionService Executor { get; }

        public Fixture()
        {
            Producer = new(key);
            Transport = new(key);
            var clock = new Clock();
            var source = new SignedRuntimeObservationSource(Transport, clock, new ProcessRuntimeAttestationReplayGuard());
            var assessment = new RuntimeAdvisoryFindingService(Catalog, new RuntimeDeploymentAdvisoryEvaluator(source),
                clock, new RuntimeDeploymentLifecycleEvaluator(source));
            Executor = new(new RuntimeAttestationPublisher(Producer, Authority, Transport, clock),
                new RuntimeFindingPersistenceService(assessment, Journal), Authority);
        }
        public void Dispose() => key.Dispose();
    }
}
