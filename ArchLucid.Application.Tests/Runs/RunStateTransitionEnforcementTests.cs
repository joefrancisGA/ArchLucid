using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunStateTransitionEnforcementTests
{
    [Fact]
    public void EnsureCommitAllowed_throws_conflict_when_transition_denied()
    {
        Mock<IRunStateTransitionService> transitions = new();
        transitions
            .Setup(t => t.ValidateCommitAllowed(ArchitectureRunStatus.Failed))
            .Returns(RunStateTransitionCheck.Denied("cannot be committed in Failed status."));
        ArchitectureRun run = new() { Status = ArchitectureRunStatus.Failed };

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowed(transitions.Object, run, "run-1");

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*run-1*cannot be committed in Failed status*");
    }

    [Fact]
    public void EnsureCommitAllowed_uses_default_message_when_check_message_is_blank()
    {
        Mock<IRunStateTransitionService> transitions = new();
        transitions
            .Setup(t => t.ValidateCommitAllowed(ArchitectureRunStatus.Failed))
            .Returns(new RunStateTransitionCheck(false, "   "));
        ArchitectureRun run = new() { Status = ArchitectureRunStatus.Failed };

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowed(transitions.Object, run, "run-2");

        act.Should().Throw<ConflictException>().WithMessage("*run-2*cannot be committed*");
    }

    [Fact]
    public void EnsureCommitAllowedLegacy_throws_conflict_when_transition_denied()
    {
        Mock<IRunStateTransitionService> transitions = new();
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        transitions
            .Setup(t => t.ValidateCommitAllowedLegacy("Created"))
            .Returns(RunStateTransitionCheck.Denied("is not ready for commit."));

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowedLegacy(transitions.Object, runId, "Created");

        act.Should()
            .Throw<ConflictException>()
            .WithMessage($"*'{runId:D}'*is not ready for commit*");
    }
}
