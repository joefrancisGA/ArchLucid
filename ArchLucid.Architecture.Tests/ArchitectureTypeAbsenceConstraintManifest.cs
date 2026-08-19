namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Type-placement rules, keyed by the rule sentence that appears in CI output: orchestration types that
///     must not be hosted by an adapter or leaf assembly.
/// </summary>
internal static class ArchitectureTypeAbsenceConstraintManifest
{
    internal static readonly IReadOnlyDictionary<string, TypeAbsenceConstraint> Rules = Build();

    internal static TypeAbsenceConstraint Rule(string ruleName)
        => ArchitectureConstraintManifestLookup.Rule(Rules, ruleName);

    private static IReadOnlyDictionary<string, TypeAbsenceConstraint> Build()
    {
        Dictionary<string, TypeAbsenceConstraint> rules = new(StringComparer.Ordinal)
        {
            ["Application must not export GovernanceAuditEventTypes"] = new(
                "ArchLucid.Application",
                ["GovernanceAuditEventTypes"],
                ArchitectureTypeVisibilityScope.Exported,
                "use AuditEventTypes.Baseline.Governance only."),

            ["Persistence must not export advisory orchestration services"] = new(
                "ArchLucid.Persistence",
                ["AdvisoryScanRunner", "RecommendationLearningService"],
                ArchitectureTypeVisibilityScope.Exported,
                "orchestration lives in ArchLucid.Application.Advisory; ArchLucid.Persistence hosts SQL adapters only."),

            ["Persistence must not contain the authority orchestrator"] = new(
                "ArchLucid.Persistence",
                [
                    "AuthorityRunOrchestrator",
                    "AuthorityCommittedPipelineFinalizer",
                    "AuthorityPipelineStagesExecutor",
                    "OrchestratorTransientDbRetry",
                    "AuthorityPipelineWorkPayload",
                    "AuthorityPipelineWorkPayloadJson",
                    "InlineAuthorityPipelineStagesExecutionDriver",
                ],
                ArchitectureTypeVisibilityScope.All,
                "authority orchestration lives in ArchLucid.Application.Runs.Orchestration; Persistence hosts SQL/work adapters only."),

            ["Contracts must not contain IReviewEngine"] = new(
                "ArchLucid.Contracts",
                ["IReviewEngine"],
                ArchitectureTypeVisibilityScope.Exported,
                "IReviewEngine was removed (EK-01); use IAgentExecutor. Review evaluation kernel is AuthorityPipelineStagesExecutor."),
        };

        return rules;
    }
}
