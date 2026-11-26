using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimeAttestationPublisherTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly RuntimeObservationRequest Request = new(Guid.NewGuid(), Guid.NewGuid(),
        Guid.NewGuid(), "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app", "generation", "php");
    private static RuntimeObservationBatch Batch() => new(Request, Now.AddMinutes(-2), true,
        ["one"], [new("one", "8.4.2", Now.AddMinutes(-1))], "untrusted-reference");

    [Fact]
    public async Task Denial_prevents_collection_signing_and_publication()
    {
        var producer = new Producer(Batch());
        var store = new Store();
        Assert.False(await Publish(producer, new Authority(false), store));
        Assert.Equal(0, producer.CollectionCalls);
        Assert.Equal(0, producer.SignCalls);
        Assert.Equal(0, store.Calls);
    }

    [Fact]
    public async Task Revocation_after_signing_prevents_publication()
    {
        var producer = new Producer(Batch());
        var store = new Store();
        Assert.False(await Publish(producer, new Authority(true, false), store));
        Assert.Equal(1, producer.SignCalls);
        Assert.Equal(0, store.Calls);
    }

    [Fact]
    public async Task Foreign_stale_or_incomplete_batch_is_not_signed()
    {
        var original = Batch();
        foreach (var batch in new[]
        {
            original with { Scope = Request with { TenantId = Guid.NewGuid() } },
            original with { EnumeratedAt = Now.AddHours(-1) },
            original with { InstanceIds = ["one", "two"] },
            original with { InstanceIds = ["one", "one"] },
            original with { Observations = [new("other", "8.4.2", Now.AddMinutes(-1))] }
        })
        {
            var producer = new Producer(batch);
            var store = new Store();
            Assert.False(await Publish(producer, new Authority(true), store));
            Assert.Equal(0, producer.SignCalls);
            Assert.Equal(0, store.Calls);
        }
    }

    [Fact]
    public async Task Modified_payload_is_never_published()
    {
        var producer = new Producer(Batch(), tamper: true);
        var store = new Store();
        Assert.False(await Publish(producer, new Authority(true), store));
        Assert.Equal(0, store.Calls);
    }

    [Fact]
    public async Task Valid_publication_strips_untrusted_evidence_reference()
    {
        var store = new Store();
        Assert.True(await Publish(new Producer(Batch()), new Authority(true), store));
        Assert.Equal(1, store.Calls);
        Assert.NotNull(store.Envelope);
        var attestation = JsonSerializer.Deserialize<RuntimeObservationAttestation>(store.Envelope.Payload);
        Assert.NotNull(attestation);
        Assert.Equal(Request, attestation.Batch.Scope);
        Assert.Equal(string.Empty, attestation.Batch.EvidenceReference);
        Assert.Equal(Now.AddMinutes(5), attestation.ExpiresAt);
    }

    private static Task<bool> Publish(Producer producer, Authority authority, Store store) =>
        new RuntimeAttestationPublisher(producer, authority, store, new Clock())
            .PublishAsync(Request, CancellationToken.None);

    private sealed class Clock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class Authority(bool initial, bool subsequent = true) : IRuntimeAttestationPublicationAuthority
    {
        private int calls;
        public Task<bool> CanPublishAsync(RuntimeObservationRequest request, CancellationToken ct) =>
            Task.FromResult(calls++ == 0 ? initial : subsequent);
    }

    private sealed class Producer(RuntimeObservationBatch batch, bool tamper = false) : IAuthorizedRuntimeAttestationProducer
    {
        public int CollectionCalls { get; private set; }
        public int SignCalls { get; private set; }
        public Task<RuntimeObservationBatch?> CollectAsync(RuntimeObservationRequest request, CancellationToken ct)
        {
            CollectionCalls++;
            return Task.FromResult<RuntimeObservationBatch?>(batch);
        }
        public Task<SignedRuntimeObservationEnvelope?> SignAsync(RuntimeObservationRequest request, byte[] payload, CancellationToken ct)
        {
            SignCalls++;
            if (tamper) payload[0] ^= 1;
            return Task.FromResult<SignedRuntimeObservationEnvelope?>(new("key-1", payload, new byte[64]));
        }
    }

    private sealed class Store : IRuntimeAttestationPublicationStore
    {
        public int Calls { get; private set; }
        public SignedRuntimeObservationEnvelope? Envelope { get; private set; }
        public Task<bool> PublishAsync(RuntimeObservationRequest request, SignedRuntimeObservationEnvelope envelope, CancellationToken ct)
        {
            Calls++;
            Envelope = envelope;
            return Task.FromResult(true);
        }
    }
}
