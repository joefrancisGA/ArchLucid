using ArchLucid.Application.Runs.Orchestration.Pipeline;

namespace ArchLucid.Application.Analysis;

/// <summary>Canonical declarations for the active branches. Inapplicable branches are not missing dependencies.</summary>
internal static class AnalysisDependencyGraphs
{
    internal const string AuthorityPublish = "seal_and_publish";
    internal const string Prior = "securenow.prior_snapshot";
    internal const string Audit = "securenow.audit_readiness";
    internal const string Plan = "securenow.reuse_plan";
    internal const string Job = "securenow.job";
    internal const string Carry = "securenow.carry_forward";

    internal static AnalysisDependencyGraph Authority { get; } = new("authority/v1",
        new(AuthorityPipelineStageNames.ContextIngestion, ["request", "engine", "configuration"]),
        new(AuthorityPipelineStageNames.Graph, ["evidence", "architecture", "knowledge", "configuration"],
            AuthorityPipelineStageNames.ContextIngestion),
        new(AuthorityPipelineStageNames.Findings, ["policy", "evidence", "engine", "configuration", "agent_results"],
            AuthorityPipelineStageNames.ContextIngestion, AuthorityPipelineStageNames.Graph),
        new(AuthorityPublish, ["publication_policy", "engine", "configuration"],
            AuthorityPipelineStageNames.ContextIngestion, AuthorityPipelineStageNames.Graph, AuthorityPipelineStageNames.Findings));

    internal static AnalysisDependencyGraph SecurePrelude { get; } = new("securenow/prelude/v1",
        new(Prior, ["capture", "subscription"]),
        new(Audit, ["diff", "capture"], Prior));

    internal static AnalysisDependencyGraph SecureFull { get; } = SecureGraph(false);
    internal static AnalysisDependencyGraph SecureCarry { get; } = SecureGraph(true);

    private static AnalysisDependencyGraph SecureGraph(bool carry)
    {
        const string privilege = "securenow.privilege";
        const string reachability = "securenow.reachability";
        const string toxic = "securenow.toxic";
        const string capability = "securenow.capability_flow";
        const string shared = "securenow.shared_control";
        const string drift = "securenow.drift";
        const string rank = "securenow.ranking";
        const string cut = "securenow.cut_point";
        const string routing = "securenow.routing";
        List<AnalysisDependencyStage> stages = [new(Plan, ["target_capture", "prior_capture", "diff", "reuse_policy"])];
        string[] paths = carry ? [Carry] : [privilege, reachability, toxic, capability, shared];

        if (carry)
        {
            stages.Add(new(Carry, ["verified_prior_path_receipt", "target_capture", "path_configuration"], Plan));
        }
        else
        {
            stages.Add(new(privilege, ["capture", "engine", "path_configuration"], Plan));
            stages.Add(new(reachability, ["capture", "engine", "path_configuration"], Plan));
            stages.Add(new(toxic, ["capture", "engine", "path_configuration"], privilege, reachability));
            stages.Add(new(capability, ["capture", "engine", "path_configuration"], Plan));
            stages.Add(new(shared, ["capture", "engine", "path_configuration"], Plan));
        }

        stages.Add(new(drift, ["diff", "diagram_reconciliation", "configuration"], paths));
        stages.Add(new(rank, ["rank_weights", "asset_assertions"], [.. paths, drift]));
        stages.Add(new(cut, ["remediation_patterns"], rank));
        stages.Add(new(routing, ["configuration"], [.. paths, drift]));
        stages.Add(new(Job, ["target_capture", "output_witness", "search_coverage"], cut, routing));

        return new AnalysisDependencyGraph(carry ? "securenow/carry/v1" : "securenow/full/v1", [.. stages]);
    }
}
