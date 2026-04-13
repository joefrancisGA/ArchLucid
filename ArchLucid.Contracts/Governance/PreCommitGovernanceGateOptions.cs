namespace ArchLucid.Contracts.Governance;

/// <summary>Feature gate for optional pre-commit governance enforcement.</summary>
public sealed class PreCommitGovernanceGateOptions
{
    public const string SectionPath = "ArchLucid:Governance";

    /// <summary>When false (default), <see cref="IPreCommitGovernanceGate"/> is not invoked.</summary>
    public bool PreCommitGateEnabled { get; set; }
}
