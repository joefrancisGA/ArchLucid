namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Response for <c>POST /v1/policy-packs/validate</c> and CLI <c>policy validate</c> success payloads.
/// </summary>
public sealed class PolicyPackContentValidationResponse
{
    public bool Valid
    {
        get;
        set;
    }

    public PolicyPackContentValidationSummary Summary
    {
        get;
        set;
    } = new();

    public List<PolicyPackContentValidationIssue> Issues
    {
        get;
        set;
    } = [];
}
