using System.Text;

using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerPromptFormatterTests
{
    [Fact]
    public void FormatTechnologyLedgerContext_returns_empty_when_no_entries()
    {
        TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext([]).Should().BeEmpty();
    }

    [Fact]
    public void FormatTechnologyLedgerContext_returns_formatted_block_when_entries_exist()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> entries =
        [
            CreateEntry(TechnologyLedgerRole.CloudPlatform, "Microsoft Azure", TechnologyLedgerStatus.Chosen, utc),
        ];

        string text = TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext(entries);

        text.Should().Contain("Technology Ledger (canonical baseline for this run):");
        text.Should().Contain("CloudPlatform");
    }

    [Fact]
    public void AppendTechnologyLedgerContext_sorts_by_role_then_created_utc()
    {
        DateTime earlier = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        DateTime later = DateTime.SpecifyKind(new DateTime(2026, 1, 2, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> entries =
        [
            CreateEntry(TechnologyLedgerRole.Region, "eastus", TechnologyLedgerStatus.Chosen, later),
            CreateEntry(TechnologyLedgerRole.CloudPlatform, "Microsoft Azure", TechnologyLedgerStatus.Chosen, earlier),
        ];

        StringBuilder sb = new();
        TechnologyLedgerPromptFormatter.AppendTechnologyLedgerContext(sb, entries);
        string text = sb.ToString();

        int cloudIndex = text.IndexOf("CloudPlatform", StringComparison.Ordinal);
        int regionIndex = text.IndexOf("Region", StringComparison.Ordinal);
        cloudIndex.Should().BeLessThan(regionIndex);
        text.Should().Contain("Chosen");
    }

    [Fact]
    public void AppendTechnologyLedgerContext_truncates_after_thirty_two_entries()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> entries = Enumerable.Range(0, 40)
            .Select(index => CreateEntry(TechnologyLedgerRole.Other, $"tech-{index}", TechnologyLedgerStatus.Assumed, utc))
            .ToList();

        StringBuilder sb = new();
        TechnologyLedgerPromptFormatter.AppendTechnologyLedgerContext(sb, entries);
        string text = sb.ToString();

        text.Should().Contain("truncated");
        text.Should().Contain("32 of 40");
    }

    private static TechnologyLedgerEntry CreateEntry(
        TechnologyLedgerRole role,
        string technologyName,
        TechnologyLedgerStatus status,
        DateTime createdUtc) =>
        new()
        {
            RunId = "run-1",
            Role = role,
            TechnologyName = technologyName,
            ProviderFamily = CloudProvider.Azure,
            Status = status,
            Source = TechnologyLedgerSource.User,
            CreatedUtc = createdUtc,
            UpdatedUtc = createdUtc,
        };
}
