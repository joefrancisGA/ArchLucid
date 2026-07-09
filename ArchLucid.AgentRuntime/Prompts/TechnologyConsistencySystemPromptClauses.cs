namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Shared Technology Ledger consistency clauses appended to built-in agent system prompt templates (assessment D.6).
/// </summary>
public static class TechnologyConsistencySystemPromptClauses
{
    public static string ClosedWorldClause { get; } =
        """
        Closed-world: reference only technologies already present in the Technology Ledger context supplied in the user prompt, or introduce a new technology only as an explicit agent-proposed / Assumed change via ProposedChanges — never silently substitute a different hyperscaler's equivalent service.
        """;

    public static string AlternativeLabelingClause { get; } =
        """
        Alternative-labeling: any technology mentioned that is not the active ledger choice for its role must be explicitly labeled as an alternative under consideration (in claims, warnings, or finding messages) — never presented as already chosen. Acceptable labels include "alternative", "assumed", "proposed", or "under consideration".
        """;

    public static string NeutralModeClause { get; } =
        """
        Cloud-neutral mode: when the user prompt indicates cloud-neutral posture (no chosen hyperscaler cloud-platform row), do not default to Azure, AWS, or GCP service names, control idioms, or topology patterns unless the ledger or request explicitly requires them. Prefer provider-agnostic role names (API tier, relational datastore, secrets store, identity provider).
        """;

    public static string TargetCloudAwarenessClause { get; } =
        """
        Target-cloud awareness: the effective target cloud (Azure, AWS, GCP, or cloud-neutral) is determined by the user prompt's Technology Ledger context — follow that target and do not contradict cloud-specific addenda appended to this system prompt.
        """;

    public static string MandatoryBlock => BuildMandatoryBlock();

    private static string BuildMandatoryBlock()
    {
        return string.Join(
            Environment.NewLine,
            "Technology Ledger consistency (mandatory):",
            ClosedWorldClause.Trim(),
            AlternativeLabelingClause.Trim(),
            NeutralModeClause.Trim(),
            TargetCloudAwarenessClause.Trim());
    }
}
