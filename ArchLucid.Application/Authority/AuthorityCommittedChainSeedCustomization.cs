using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Authority;

/// <summary>Optional demo/tour payloads layered onto <see cref="IAuthorityCommittedManifestChainWriter"/> without forking FK writers.</summary>
public sealed class AuthorityCommittedChainSeedCustomization
{
    /// <summary>Appended after the seeded <c>system</c> canonical row (capture + synthetic attachments).</summary>
    public IReadOnlyList<CanonicalObject>? AdditionalCanonicalObjects
    {
        get;
        init;
    }

    /// <summary>When set, substitutes the demo graph instead of checkout-style placeholders.</summary>
    public GraphSnapshot? GraphSnapshotOverride
    {
        get;
        init;
    }

    /// <summary>Appended to the rule-audit <c>Notes</c> list (decision narratives).</summary>
    public IReadOnlyList<string>? AdditionalRuleAuditNotes
    {
        get;
        init;
    }
}
