using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
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
}
