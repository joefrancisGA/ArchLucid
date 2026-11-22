using ArchLucid.Application.Governance;
using ArchLucid.Core.Tenancy;
using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecurrenceCompletionRecipientResolverTests
{
    [Fact]
    public async Task InvalidCreatorAndAdminMailboxesAreExcluded()
    {
        Guid tenant = Guid.NewGuid();
        Mock<ISponsorReportRecipientLookup> lookup = new();
        lookup.Setup(x => x.ListRecipientMailboxesAsync(tenant, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["@", "not-an-email", " admin@example.com ", "Name <admin@example.com>"]);
        RecurrenceCompletionRecipientResolver sut = new(lookup.Object);

        IReadOnlyList<string> recipients = await sut.ListRecipientMailboxesAsync(
            tenant, "creator@", CancellationToken.None);

        Assert.Equal(["admin@example.com"], recipients);
    }

    [Fact]
    public async Task ValidCreatorIsDeduplicatedAgainstAdminCaseInsensitively()
    {
        Guid tenant = Guid.NewGuid();
        Mock<ISponsorReportRecipientLookup> lookup = new();
        lookup.Setup(x => x.ListRecipientMailboxesAsync(tenant, It.IsAny<CancellationToken>()))
            .ReturnsAsync(["PERSON@example.com"]);
        RecurrenceCompletionRecipientResolver sut = new(lookup.Object);

        IReadOnlyList<string> recipients = await sut.ListRecipientMailboxesAsync(
            tenant, "person@example.com", CancellationToken.None);

        Assert.Single(recipients);
    }
}
