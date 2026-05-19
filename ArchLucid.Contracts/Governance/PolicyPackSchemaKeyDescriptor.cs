namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Flat descriptor for one configurable path in <see cref="PolicyPackContentDocument" /> JSON.
/// </summary>
public sealed class PolicyPackSchemaKeyDescriptor
{
    /// <summary>Dot-delimited JSON path (e.g. <c>complianceRuleIds</c>, <c>advisoryDefaults.{key}</c>).</summary>
    public string Path
    {
        get;
        set;
    } = null!;

    /// <summary>JSON Schema <c>type</c> for this node (e.g. <c>array</c>, <c>object</c>).</summary>
    public string JsonType
    {
        get;
        set;
    } = null!;

    /// <summary>Scalar or item value type when applicable (e.g. <c>string</c> for UUID arrays).</summary>
    public string? ValueType
    {
        get;
        set;
    }

    /// <summary>JSON Schema <c>format</c> for scalar or item values (e.g. <c>uuid</c>).</summary>
    public string? ValueFormat
    {
        get;
        set;
    }

    /// <summary>When true, callers may supply arbitrary keys under this object path.</summary>
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
}
