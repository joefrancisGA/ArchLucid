using ArchLucid.Core.Ask;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Ask;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AskRequestAndResponseTests
{
    [Fact]
    public void AskRequest_and_AskResponse_round_trip_properties()
    {
        Guid threadId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid targetRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        AskRequest request = new()
        {
            ThreadId = threadId,
            RunId = runId,
            BaseRunId = runId,
            TargetRunId = targetRunId,
            Question = "What changed between runs?",
        };

        request.ThreadId.Should().Be(threadId);
        request.RunId.Should().Be(runId);
        request.BaseRunId.Should().Be(runId);
        request.TargetRunId.Should().Be(targetRunId);
        request.Question.Should().Be("What changed between runs?");

        AskResponse response = new()
        {
            ThreadId = threadId,
            Answer = "Both runs share the same storage tier.",
            ReferencedDecisions = ["dec-1"],
            ReferencedFindings = ["finding-9"],
            ReferencedArtifacts = ["manifest-v3"],
            ComparisonNarrative = "Target run adds encryption.",
            RetrievalDegraded = true,
        };

        response.ThreadId.Should().Be(threadId);
        response.Answer.Should().Contain("storage tier");
        response.ReferencedDecisions.Should().ContainSingle("dec-1");
        response.ReferencedFindings.Should().ContainSingle("finding-9");
        response.ReferencedArtifacts.Should().ContainSingle("manifest-v3");
        response.ComparisonNarrative.Should().Contain("encryption");
        response.RetrievalDegraded.Should().BeTrue();
    }
}
