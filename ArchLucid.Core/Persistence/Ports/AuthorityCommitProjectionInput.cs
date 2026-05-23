namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Caller-supplied fields that are not derivable from <see cref="Cm.GoldenManifest" /> alone.</summary>
public sealed class AuthorityCommitProjectionInput
{
    /// <summary>Human-readable system / solution name (sibling <c>ArchitectureRequest</c> or project title).</summary>
    public string SystemName
    {
        get;
        init;
    } = string.Empty;
}
