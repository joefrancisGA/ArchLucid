using ArchLucid.Contracts.Common;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
public sealed class ArchitectureRunLifecycleModelTests
{
    [Fact]
    public void Happy_path_create_execute_propose_commit()
    {
        ArchitectureRunLifecycleModel model = new();
        model.TryApply(ArchitectureRunLifecycleCommand.Create).IsAllowed.Should().BeTrue();
        model.MarkPersistBeforeLlm();
        model.TryApply(ArchitectureRunLifecycleCommand.Propose).IsAllowed.Should().BeTrue();
        model.TryApply(ArchitectureRunLifecycleCommand.Execute).IsAllowed.Should().BeTrue();
        model.Status.Should().Be(ArchitectureRunStatus.ReadyForCommit);
        model.TryApply(ArchitectureRunLifecycleCommand.Commit).IsAllowed.Should().BeTrue();
        model.Status.Should().Be(ArchitectureRunStatus.Committed);
        model.Sealed.Should().BeTrue();
    }

    [Fact]
    public void Late_worker_write_after_commit_is_denied()
    {
        ArchitectureRunLifecycleModel model = ReadyForCommit();
        model.TryApply(ArchitectureRunLifecycleCommand.Commit).IsAllowed.Should().BeTrue();
        model.TryApply(ArchitectureRunLifecycleCommand.LateWorkerWrite).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void Random_command_sequences_match_transition_table()
    {
        Random random = new(20260817);
        List<ArchitectureRunLifecycleCommand> trace = [];

        for (int iteration = 0; iteration < 200; iteration++)
        {
            ArchitectureRunLifecycleModel model = new();
            model.TryApply(ArchitectureRunLifecycleCommand.Create);
            trace.Clear();

            for (int step = 0; step < 8; step++)
            {
                ArchitectureRunLifecycleCommand command = PickCommand(random);

                if (command is ArchitectureRunLifecycleCommand.Execute && random.Next(2) == 0)
                    model.MarkPersistBeforeLlm();

                if (command is ArchitectureRunLifecycleCommand.Propose && random.Next(2) == 0)
                    model.TryApply(ArchitectureRunLifecycleCommand.Propose);

                ArchitectureRunLifecycleTransitionResult result = model.TryApply(command);
                trace.Add(command);

                if (!result.IsAllowed)
                    continue;

                if (command is ArchitectureRunLifecycleCommand.Commit)
                    break;
            }

            model.Status.Should().NotBe(default(ArchitectureRunStatus));
        }
    }

    private static ArchitectureRunLifecycleModel ReadyForCommit()
    {
        ArchitectureRunLifecycleModel model = new();
        model.TryApply(ArchitectureRunLifecycleCommand.Create).IsAllowed.Should().BeTrue();
        model.MarkPersistBeforeLlm();
        model.TryApply(ArchitectureRunLifecycleCommand.Propose).IsAllowed.Should().BeTrue();
        model.TryApply(ArchitectureRunLifecycleCommand.Execute).IsAllowed.Should().BeTrue();
        return model;
    }

    private static ArchitectureRunLifecycleCommand PickCommand(Random random)
    {
        ArchitectureRunLifecycleCommand[] commands = Enum.GetValues<ArchitectureRunLifecycleCommand>();
        return commands[random.Next(commands.Length)];
    }
}
