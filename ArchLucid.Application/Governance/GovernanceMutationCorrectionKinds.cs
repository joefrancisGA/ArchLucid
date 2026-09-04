namespace ArchLucid.Application.Governance;

/// <summary>Mutation kinds that support append-only correction audit events (LI-05).</summary>
public static class GovernanceMutationCorrectionKinds
{
    public const string QuickApprove = "governance_quick_approve";

    public const string WorkflowApprove = "governance_workflow_approve";

    public const string WorkflowReject = "governance_workflow_reject";

    public const string WorkflowPromote = "governance_workflow_promote";

    public const string WorkflowActivate = "governance_workflow_activate";

    private static readonly HashSet<string> SupportedKinds = new(StringComparer.Ordinal)
    {
        QuickApprove,
        WorkflowApprove,
        WorkflowReject,
        WorkflowPromote,
        WorkflowActivate,
    };

    public static bool IsSupported(string? mutationKind) =>
        !string.IsNullOrWhiteSpace(mutationKind) && SupportedKinds.Contains(mutationKind.Trim());
}
