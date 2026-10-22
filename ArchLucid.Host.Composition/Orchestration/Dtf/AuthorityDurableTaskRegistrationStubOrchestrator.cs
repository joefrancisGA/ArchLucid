using Microsoft.DurableTask;

namespace ArchLucid.Host.Composition.Orchestration.Dtf;

/// <summary>
///     Minimal orchestrator so <c>Microsoft.DurableTask.Generators</c> emits
///     <c>AddAllGeneratedTasks</c> for worker registration. Replace with the real authority pipeline orchestration when wired
///     end-to-end.
/// </summary>
[DurableTask]
public partial class AuthorityDurableTaskRegistrationStubOrchestrator : TaskOrchestrator<object?, object?>
{
    /// <inheritdoc />
    public override Task<object?> RunAsync(TaskOrchestrationContext context, object? input) =>
        Task.FromResult<object?>(null);
}
