using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Pilots;

internal static class BuyerProofPackLimitationsMarkdown
{
    internal static string Build(ArchitectureRunDetail detail, bool demoDataWarning)
    {
        List<string> lines =
        [
            "# Limitations and recommended next actions",
            "",
            "This sponsor proof pack summarizes one committed architecture review. Values labeled **estimated** are model- or heuristic-derived — not observed customer savings unless separately attested.",
            "",
        ];

        if (demoDataWarning)
        {
            lines.Add("- **Demo data warning:** This run used demo or sample tenant data. Do not circulate externally without replacing with a production pilot run.");
            lines.Add("");
        }

        lines.Add("## Recommended next actions");
        lines.Add("");
        lines.Add("1. Record finding dispositions (Accepted, Remediated, Deferred) so ROI basis reflects realized vs potential value.");
        lines.Add("2. Complete pilot ROI baseline fields before quoting expansion pricing.");
        lines.Add("3. Attach this pack to your internal architecture review or procurement thread — not as SOC 2, pen-test, or invoiced COGS evidence.");
        lines.Add("");
        lines.Add("## What this pack does not claim");
        lines.Add("");
        lines.Add("- CPA SOC 2 attestation or third-party penetration test completion");
        lines.Add("- Realized USD savings unless disposition workflow and attestation fields are populated");
        lines.Add("- Live marketplace checkout or contractual SLO guarantees");
        lines.Add("");

        return string.Join('\n', lines);
    }
}

internal static class BuyerProofPackTrustPointerMarkdown
{
    internal static readonly string Value =
        """
        # Trust posture (pointer)

        This pack includes a **one-page narrative pointer**, not the full procurement bundle.

        - Canonical buyer trust narrative: repository `docs/go-to-market/TRUST_CENTER.md` (and hosted `/trust` when deployed).
        - Security and tenant isolation depth: `docs/security/` and `docs/library/V1_SCOPE.md`.

        Review the first-value report **Sponsor send readiness (buyer-safe gate)** and demo banners before external circulation.

        """;
}
