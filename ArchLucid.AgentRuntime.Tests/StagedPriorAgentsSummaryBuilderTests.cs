using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StagedPriorAgentsSummaryBuilderTests
{
    [Fact]
    public void CreateNote_redacts_email_and_sk_like_patterns()
    {
        AgentResult r = new()
        {
            AgentType = AgentType.Topology,
            ResultId = "r1",
            TaskId = "t1",
            Confidence = 0.5,
            Claims = ["Contact ops@contoso.com for access.", "key sk-12345678901234567890deadbeef"],
            EvidenceRefs = []
        };

        StagedCriticAgentOptions options = new();
        EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote([r], options);

        note.NoteType.Should().Be(EvidenceNoteTypes.StagedPriorAgentsSummary);
        note.Message.Should().Contain("[redacted-email]");
        note.Message.Should().Contain("[redacted-secret]");
        note.Message.Should().NotContain("ops@contoso.com");
    }

    [Fact]
    public void CreateNote_prepends_ledger_section_when_entries_supplied()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> ledger =
        [
            new()
            {
                RunId = "run-1",
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = utc,
                UpdatedUtc = utc,
            },
        ];

        AgentResult topology = new()
        {
            AgentType = AgentType.Topology,
            ResultId = "r1",
            TaskId = "t1",
            Confidence = 0.5,
            Claims = ["stable topology"],
            EvidenceRefs = [],
        };

        StagedCriticAgentOptions options = new();
        EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote([topology], options, ledger);

        note.Message.Should().Contain("## Technology Ledger (snapshot at staged Critic boundary)");
        note.Message.Should().Contain("CloudPlatform");
        note.Message.Should().Contain("Topology");
    }

    [Fact]
    public void CreateNote_ledger_section_respects_total_char_budget()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> ledger = Enumerable.Range(0, 20)
            .Select(index => new TechnologyLedgerEntry
            {
                RunId = "run-1",
                Role = TechnologyLedgerRole.Other,
                TechnologyName = $"technology-row-{index:D2}-with-padding",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = utc,
                UpdatedUtc = utc,
            })
            .ToList();

        StagedCriticAgentOptions options = new() { SummaryMaxTotalChars = 2_000 };
        options.Normalize();
        EvidenceNote note = StagedPriorAgentsSummaryBuilder.CreateNote([], options, ledger);

        note.Message.Length.Should().BeLessOrEqualTo(options.SummaryMaxTotalChars);
        note.Message.Should().Contain("Technology Ledger");
    }
}
