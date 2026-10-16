using ArchLucid.Contracts.Serialization;

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

    private PolicyPackContentValidationSummary summary = new();

    public PolicyPackContentValidationSummary Summary
    {
        get => summary;
        set => summary = value ?? new();
    }

    private List<PolicyPackContentValidationIssue> issues = [];

    public List<PolicyPackContentValidationIssue> Issues
    {
        get => issues;
        set => issues = ContractCollectionDefaults.Coalesce(value);
    }
}
