using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-070: resolve typed/model claim text for semantic support scoring.
///     Architect restatement (LP-15) is disposition-trail human judgment and is excluded here.
/// </summary>
public static class FindingSemanticSupportBandClaimMessageResolver
{
    public static string Resolve(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.Rationale))
            return finding.Rationale.Trim();

        return finding.Title.Trim();
    }
}
