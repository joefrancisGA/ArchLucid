namespace ArchLucid.Decisioning.Advisory.Workflow;

/// <summary>Compatibility shim; canonical constants are in <see cref="ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType" />.</summary>
public static class RecommendationActionType
{
    public const string Accept = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType.Accept;
    public const string Reject = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType.Reject;
    public const string Defer = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType.Defer;
    public const string MarkImplemented = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType.MarkImplemented;
}
