using ArchLucid.Core.Notifications;
using ArchLucid.Persistence.Notifications;

namespace ArchLucid.Persistence.Tests.Notifications;
[Trait("Category", "Unit")]

public sealed class InMemorySentEmailLedgerTests
{
    [SkippableFact]
    public async Task TryRecordSentAsync_false_when_key_blank()
    {
        InMemorySentEmailLedger sut = new();
        SentEmailLedgerEntry entry = new("  ", Guid.NewGuid(), "t", "p", null);

        bool ok = await sut.TryRecordSentAsync(entry, CancellationToken.None);

        ok.Should().BeFalse();
    }

    [SkippableFact]
    public async Task TryRecordSentAsync_true_then_false_duplicate()
    {
        InMemorySentEmailLedger sut = new();
        SentEmailLedgerEntry entry = new("key-1", Guid.NewGuid(), "t", "p", null);

        bool first = await sut.TryRecordSentAsync(entry, CancellationToken.None);
        bool second = await sut.TryRecordSentAsync(entry, CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeFalse();
    }

    [SkippableFact]
    public async Task TryRecordSentAsync_trims_key()
    {
        InMemorySentEmailLedger sut = new();
        Guid tenantId = Guid.NewGuid();
        SentEmailLedgerEntry a = new("  abc  ", tenantId, "t", "p", null);
        SentEmailLedgerEntry b = new("abc", tenantId, "t", "p", null);

        await sut.TryRecordSentAsync(a, CancellationToken.None);
        bool dup = await sut.TryRecordSentAsync(b, CancellationToken.None);

        dup.Should().BeFalse();
    }
    [SkippableFact]
    public async Task TryRecordSentAsync_allows_same_key_for_different_tenants()
    {
        InMemorySentEmailLedger sut = new();
        SentEmailLedgerEntry firstTenantEntry = new("shared-key", Guid.NewGuid(), "t", "p", null);
        SentEmailLedgerEntry secondTenantEntry = new("shared-key", Guid.NewGuid(), "t", "p", null);

        bool first = await sut.TryRecordSentAsync(firstTenantEntry, CancellationToken.None);
        bool second = await sut.TryRecordSentAsync(secondTenantEntry, CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeTrue();
    }

    [SkippableFact]
    public async Task IsRecordedAsync_only_returns_true_for_the_recorded_tenant()
    {
        InMemorySentEmailLedger ledger = new();
        Guid recordedTenant = Guid.NewGuid();
        Guid otherTenant = Guid.NewGuid();
        await ledger.TryRecordSentAsync(new("key", recordedTenant, "t", "p", null), CancellationToken.None);

        (await ledger.IsRecordedAsync(recordedTenant, "key", CancellationToken.None)).Should().BeTrue();
        (await ledger.IsRecordedAsync(otherTenant, "key", CancellationToken.None)).Should().BeFalse();
    }
}
