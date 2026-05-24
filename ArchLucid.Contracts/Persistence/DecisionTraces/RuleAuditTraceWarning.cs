namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>
///     Diagnostic entry when a decision rule matches a finding type but required context fields are absent.
/// </summary>
public sealed class RuleAuditTraceWarning
{
    public string RuleId
    {
        get;
        set;
    } = string.Empty;

    public List<string> MissingFieldPaths
    {
        get;
        set;
    } = [];

    public string Severity
    {
        get;
        set;
    } = RuleAuditTraceWarningSeverity.Warning;
}
