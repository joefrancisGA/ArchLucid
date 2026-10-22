using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Outcome of reading one policy pack version.</summary>
public enum PolicyPackVersionLookupOutcome
{
    Found,
    PackNotFound,
    VersionNotFound,
}

/// <summary>Result of <see cref="IPolicyPackWorkflowFacade.TryGetVersionAsync"/>.</summary>
public sealed record PolicyPackVersionLookupResult(
    PolicyPackVersionLookupOutcome Outcome,
    PolicyPackVersion? Version);
