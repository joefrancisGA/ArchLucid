using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesCommandTests
{
    [Fact]
    public void PrintArchitectureListTable_uses_architecture_ids_not_draft_ids()
    {
        Guid architectureOne = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid architectureTwo = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid draftOne = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid draftTwo = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        ArchitectureIdentityListItem[] items =
        [
            new()
            {
                ArchitectureId = architectureOne,
                DisplayName = "Payments platform",
                UpdatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CurrentDraftId = draftOne,
                DraftCount = 1,
                ReviewCount = 2,
            },
            new()
            {
                ArchitectureId = architectureTwo,
                DisplayName = "Claims intake",
                UpdatedUtc = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
                CurrentDraftId = draftTwo,
                DraftCount = 1,
                ReviewCount = 0,
            },
        ];

        StringWriter writer = new();
        TextWriter previous = Console.Out;

        try
        {
            Console.SetOut(writer);
            ArchitecturesCommand.PrintArchitectureListTable(items);
        }
        finally
        {
            Console.SetOut(previous);
        }

        string output = writer.ToString();
        output.Should().Contain(architectureOne.ToString("D"));
        output.Should().Contain(architectureTwo.ToString("D"));
        output.Should().NotContain(draftOne.ToString("D"));
        output.Should().NotContain(draftTwo.ToString("D"));
    }

    [Fact]
    public void TryParseArchitectureIdentityId_rejects_draft_shaped_non_guids()
    {
        ArchitecturesCommand.TryParseArchitectureIdentityId("draft-not-an-architecture-id", out Guid parsed)
            .Should().BeFalse();
        parsed.Should().Be(Guid.Empty);
    }

    [Fact]
    public void TryParseArchitectureIdentityId_accepts_guid_architecture_ids()
    {
        Guid expected = Guid.Parse("11111111-1111-1111-1111-111111111111");

        ArchitecturesCommand.TryParseArchitectureIdentityId(expected.ToString("D"), out Guid parsed)
            .Should().BeTrue();
        parsed.Should().Be(expected);
    }
}
