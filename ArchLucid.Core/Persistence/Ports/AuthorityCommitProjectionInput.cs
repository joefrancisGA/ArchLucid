namespace ArchLucid.Core.Persistence.Ports;

using ArchLucid.Contracts.Architecture;

/// <summary>Caller-supplied fields that are not derivable from <see cref="Cm.GoldenManifest" /> alone.</summary>
public sealed class AuthorityCommitProjectionInput
{
    /// <summary>Human-readable system / solution name (sibling <c>ArchitectureRequest</c> or project title).</summary>
    public string SystemName
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Draft actors from the architecture request for diagram semantic overlay (TB-2351).</summary>
    public IReadOnlyList<ActorDescriptor> DraftActors
    {
        get;
        init;
    } = [];
}
