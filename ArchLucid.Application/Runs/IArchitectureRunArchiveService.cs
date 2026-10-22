namespace ArchLucid.Application.Runs;

/// <summary>Operator-initiated soft-archive for in-flight architecture reviews (not sealed evidence).</summary>
public interface IArchitectureRunArchiveService
{
    /// <summary>
    ///     Soft-archives <paramref name="runId" /> when it is in the caller's scope, not already archived, and has no
    ///     committed golden manifest.
    /// </summary>
    Task<ArchitectureRunArchiveOutcome> TryArchiveAsync(Guid runId, CancellationToken cancellationToken);
}
