namespace ArchLucid.Core.Configuration;

/// <summary>Runtime graph merge invariant reporting (Prompt 10).</summary>
public sealed class GraphMergeRuntimeInvariantOptions
{
    public const string SectionName = "ArchLucid:Graph:RuntimeInvariants";

    /// <summary>When false, merge-time invariant reporting is skipped entirely.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Production hosts log and audit only; never fail commit when violations are detected.</summary>
    public bool AuditOnlyInProduction { get; set; } = true;
}
