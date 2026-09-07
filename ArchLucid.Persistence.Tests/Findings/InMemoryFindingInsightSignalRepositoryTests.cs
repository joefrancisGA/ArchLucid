using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class InMemoryFindingInsightSignalRepositoryTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid RunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task TryInsertAsync_second_same_kind_is_not_created()
    {
        InMemoryFindingInsightSignalRepository repository = new();

        FindingInsightSignalSubmission submission = BuildSubmission(FindingInsightSignalKind.DidNotThinkOfThat);

        FindingInsightSignalInsertResult first = await repository.TryInsertAsync(submission);
        FindingInsightSignalInsertResult second = await repository.TryInsertAsync(submission);

        first.Created.Should().BeTrue();
        second.Created.Should().BeFalse();
        second.SignalId.Should().Be(first.SignalId);
    }

    [Fact]
    public async Task ListKindsForUserAsync_returns_distinct_recorded_kinds()
    {
        InMemoryFindingInsightSignalRepository repository = new();

        await repository.TryInsertAsync(BuildSubmission(FindingInsightSignalKind.DidNotThinkOfThat));
        await repository.TryInsertAsync(BuildSubmission(FindingInsightSignalKind.Expected));

        IReadOnlyList<FindingInsightSignalKind> kinds = await repository.ListKindsForUserAsync(
            TenantId,
            RunId,
            "finding-1",
            "operator@example.com");

        kinds.Should().BeEquivalentTo(
            [FindingInsightSignalKind.DidNotThinkOfThat, FindingInsightSignalKind.Expected]);
    }

    private static FindingInsightSignalSubmission BuildSubmission(FindingInsightSignalKind kind)
    {
        return new FindingInsightSignalSubmission
        {
            TenantId = TenantId,
            RunId = RunId,
            FindingId = "finding-1",
            UserId = "operator@example.com",
            Kind = kind
        };
    }
}
