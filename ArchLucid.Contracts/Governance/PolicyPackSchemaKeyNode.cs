namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Hierarchical view of configurable policy pack schema keys for tree UIs.
/// </summary>
public sealed class PolicyPackSchemaKeyNode
{
    /// <summary>Property name at this tree level.</summary>
    public string Name
    {
        get;
        set;
    } = null!;

    /// <summary>JSON Schema <c>type</c> for this node.</summary>
    public string JsonType
    {
        get;
        set;
    } = null!;

    /// <summary>Scalar or item value type when applicable.</summary>
    public string? ValueType
    {
        get;
        set;
    }

    /// <summary>JSON Schema <c>format</c> for scalar or item values.</summary>
    public string? ValueFormat
    {
        get;
        set;
    }

    /// <summary>When true, callers may supply arbitrary keys under this object node.</summary>
    public bool AllowsCustomKeys
    {
        get;
        set;
    }

    /// <summary>Human-readable summary for UI form labels.</summary>
    public string? Description
    {
        get;
        set;
    }

    /// <summary>Nested configurable paths (e.g. <c>{key}</c> placeholder under dictionary objects).</summary>
    public IReadOnlyList<PolicyPackSchemaKeyNode> Children
    {
        get;
        set;
    } = [];
}
