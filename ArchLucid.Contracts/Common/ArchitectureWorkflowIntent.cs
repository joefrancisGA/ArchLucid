namespace ArchLucid.Contracts.Common;

/// <summary>
///     Explicit create-vs-review workflow intent carried from homepage CTAs through intake and persisted on
///     <see cref="Requests.ArchitectureRequest.WorkflowIntent" />.
/// </summary>
public static class ArchitectureWorkflowIntent
{
    public const string CreateArchitecture = "create-architecture";

    public const string StartReview = "start-review";
}
