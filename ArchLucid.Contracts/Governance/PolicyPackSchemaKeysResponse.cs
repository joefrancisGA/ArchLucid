namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Response for <c>GET /v1/governance/schema-keys</c>: configurable keys derived from the registered
///     <see cref="PolicyPackContentDocument" /> JSON Schema.
/// </summary>
public sealed class PolicyPackSchemaKeysResponse
{
    /// <summary>Flat list of all configurable paths, sorted ordinally by <see cref="PolicyPackSchemaKeyDescriptor.Path" />.</summary>
    public IReadOnlyList<PolicyPackSchemaKeyDescriptor> Keys
    {
        get;
        set;
    } = [];

    /// <summary>Hierarchical view of the same keys for tree-based form builders.</summary>
    public IReadOnlyList<PolicyPackSchemaKeyNode> Tree
    {
        get;
        set;
    } = [];
}
