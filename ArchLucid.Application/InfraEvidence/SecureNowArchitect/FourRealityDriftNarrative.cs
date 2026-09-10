using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class FourRealityDriftNarrative
{
    public static string BuildTitle(FourRealityDriftCandidate candidate) =>
        $"Four-reality drift: observed Azure widened access on {ShortResourceName(candidate.AzureResourceId)}";

    public static string BuildDescription(FourRealityDriftCandidate candidate)
    {
        List<string> disagreements = [];

        disagreements.Add($"Observed Azure snapshot: {FormatPosture(candidate.ObservedPosture)} (ObservedFact hop).");

        if (candidate.TerraformPosture != FourRealityAccessPosture.Unknown)
        {
            disagreements.Add(
                $"Advisory Terraform mapping: {FormatPosture(candidate.TerraformPosture)} (DerivedFact from declaration properties).");
        }

        if (candidate.DiagramPosture != FourRealityAccessPosture.Unknown)
        {
            disagreements.Add(
                $"Diagram reconciliation: {FormatPosture(candidate.DiagramPosture)} (DeterministicInference / HumanAssertion per IE-19 labels).");
        }

        if (candidate.HistoricalPosture != FourRealityAccessPosture.Unknown)
        {
            disagreements.Add(
                $"Prior snapshot / inventory diff: {FormatPosture(candidate.HistoricalPosture)} (temporal IE-06 change).");
        }

        string changeClause = candidate.RelatedChangeId is Guid changeId
            ? $" Cited inventory ChangeId={changeId:D}."
            : string.Empty;

        return "Observed Azure re-opened or widened a path-relevant control while other realities indicate closed access. "
               + $"Source {candidate.SourcePathKind} path {candidate.SourcePathId:D} on resource {candidate.AzureResourceId}. "
               + string.Join(" ", disagreements)
               + changeClause
               + " This is design-control drift, not a generic CIS property miss.";
    }

    public static string BuildSourceFindingId(
        byte[] sourcePathCanonicalHash,
        Guid cloudResourceId,
        Guid? changeId)
    {
        string changeToken = changeId?.ToString("N") ?? "none";

        return Convert.ToHexStringLower(sourcePathCanonicalHash)
               + ":"
               + cloudResourceId.ToString("N")
               + ":"
               + changeToken;
    }

    private static string ShortResourceName(string azureResourceId)
    {
        int slashIndex = azureResourceId.LastIndexOf('/');

        if (slashIndex >= 0 && slashIndex < azureResourceId.Length - 1)
        {
            return azureResourceId[(slashIndex + 1)..];
        }

        return azureResourceId;
    }

    private static string FormatPosture(FourRealityAccessPosture posture) =>
        posture switch
        {
            FourRealityAccessPosture.Public => "public / widened",
            FourRealityAccessPosture.Private => "private / closed",
            _ => "unknown",
        };
}
