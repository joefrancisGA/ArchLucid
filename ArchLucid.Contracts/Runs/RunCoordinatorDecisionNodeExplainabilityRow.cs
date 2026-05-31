namespace ArchLucid.Contracts.Runs;

/// <summary>Coordinator V2 decision node row on unified run decision explainability (TB-054).</summary>
public sealed class RunCoordinatorDecisionNodeExplainabilityRow
{
    public string Pipeline
    {
        get;
        set;
    } = "coordinator_v2";

    public string DecisionId
    {
        get;
        set;
    } = string.Empty;

    public string Topic
    {
        get;
        set;
    } = string.Empty;

    public string? SelectedOptionId
    {
        get;
        set;
    }

    public string Rationale
    {
        get;
        set;
    } = string.Empty;

    public double Confidence
    {
        get;
        set;
    }

    public IReadOnlyList<string> SupportingEvaluationIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> OpposingEvaluationIds
    {
        get;
        set;
    } = [];
}
