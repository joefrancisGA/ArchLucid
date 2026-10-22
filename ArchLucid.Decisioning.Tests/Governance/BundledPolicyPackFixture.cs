using ArchLucid.Contracts.Governance;

namespace ArchLucid.Decisioning.Tests.Governance;

/// <summary>
///     One bundled platform policy pack plus the compliance rule ids that survive the production
///     merge-then-filter path for it.
/// </summary>
/// <param name="ContentFile">Bundled content file name, e.g. <c>soc2-tsc-architecture.json</c>.</param>
/// <param name="Content">Deserialized pack content seeded verbatim into tenant governance.</param>
/// <param name="ResolvedRuleIds">Rule ids remaining after key narrowing and the pack's priority floor.</param>
internal sealed record BundledPolicyPackFixture(
    string ContentFile,
    PolicyPackContentDocument Content,
    IReadOnlySet<string> ResolvedRuleIds);
