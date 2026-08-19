using System.Diagnostics.CodeAnalysis;

using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Api.Models;

/// <summary>
///     Request body for <c>POST /v1/policy-packs/simulate</c> — evaluates proposed pack <strong>content</strong> against a
///     committed run's findings without persisting a pack (same service path as
///     <c>POST /v1/governance/policy-packs/dry-run</c>).
/// </summary>
/// <remarks>
///     Convenience façade over <c>POST /v1/governance/policy-packs/dry-run</c> with a typed <see cref="PolicyPackContentDocument" />
///     instead of raw JSON text.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class PolicyPackSimulateRequest
{
    /// <summary>Architecture run id (hyphenated or compact GUID).</summary>
    public string RunId
    {
        get;
        set;
    } = null!;

    /// <summary>Proposed governance payload (same shape as publish <c>contentJson</c>).</summary>
    public PolicyPackContentDocument Content
    {
        get;
        set;
    } = null!;

    /// <summary>Optional override for <c>BlockCommitOnCritical</c>.</summary>
    public bool? BlockCommitOnCritical
    {
        get;
        set;
    }

    /// <summary>Optional override for minimum blocking severity ordinal.</summary>
    public int? BlockCommitMinimumSeverity
    {
        get;
        set;
    }

    /// <summary>Optional label mirrored into the dry-run result's policy pack id field.</summary>
    public Guid? ProposedPolicyPackId
    {
        get;
        set;
    }
}
