using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Summarises the original architecture request, distilled into the key inputs agents
///     need to reason about: the description, stated constraints, required capabilities, and assumptions.
/// </summary>
public sealed class RequestEvidence
{
    /// <summary>Plain-text description of the architecture request.</summary>
    public string Description
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Non-negotiable constraints the solution must satisfy (e.g., region, budget, compliance framework).</summary>
    private List<string> constraints = [];

    public List<string> Constraints
    {
        get => constraints;
        set => constraints = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Functional or non-functional capabilities the solution must provide.</summary>
    private List<string> requiredCapabilities = [];

    public List<string> RequiredCapabilities
    {
        get => requiredCapabilities;
        set => requiredCapabilities = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Assumptions baked into the request at submission time.</summary>
    private List<string> assumptions = [];

    public List<string> Assumptions
    {
        get => assumptions;
        set => assumptions = ContractCollectionDefaults.Coalesce(value);
    }
}
