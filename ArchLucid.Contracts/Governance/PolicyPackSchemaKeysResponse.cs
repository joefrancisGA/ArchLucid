using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Response for <c>GET /v1/governance/schema-keys</c>: configurable keys derived from the registered
///     <see cref="PolicyPackContentDocument" /> JSON Schema.
/// </summary>
public sealed class PolicyPackSchemaKeysResponse
{
    /// <summary>Flat list of all configurable paths, sorted ordinally by <see cref="PolicyPackSchemaKeyDescriptor.Path" />.</summary>
    private IReadOnlyList<PolicyPackSchemaKeyDescriptor> keys = [];

    public IReadOnlyList<PolicyPackSchemaKeyDescriptor> Keys
    {
        get => keys;
        set => keys = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Hierarchical view of the same keys for tree-based form builders.</summary>
    private IReadOnlyList<PolicyPackSchemaKeyNode> tree = [];

    public IReadOnlyList<PolicyPackSchemaKeyNode> Tree
    {
        get => tree;
        set => tree = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
