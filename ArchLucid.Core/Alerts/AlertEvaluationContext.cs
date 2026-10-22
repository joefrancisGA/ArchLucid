using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Comparison;

namespace ArchLucid.Core.Alerts;

public class AlertEvaluationContext
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }

    public Guid? ComparedToRunId
    {
        get;
        set;
    }

    public ImprovementPlan? ImprovementPlan
    {
        get;
        set;
    }

    public ComparisonResult? ComparisonResult
    {
        get;
        set;
    }

    public IReadOnlyList<RecommendationRecord> RecommendationRecords
    {
        get;
        set;
    } = [];

    public RecommendationLearningProfile? LearningProfile
    {
        get;
        set;
    }

    public PolicyPackContentDocument? EffectiveGovernanceContent
    {
        get;
        set;
    }
}
