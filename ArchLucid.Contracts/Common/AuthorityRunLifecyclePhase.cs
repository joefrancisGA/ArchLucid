namespace ArchLucid.Contracts.Common;

/// <summary>
///     Authority pipeline lifecycle phase (EK-07). Independent of agent-task <see cref="ArchitectureRunStatus" />.
/// </summary>
public enum AuthorityRunLifecyclePhase
{
    NotStarted = 0,
    InProgress = 1,
    Complete = 2,
    Failed = 3,
}
