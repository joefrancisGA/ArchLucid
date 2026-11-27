namespace ArchLucid.Application.Analysis;

/// <summary>Separates path evidence from downstream ranking and remediation policy.</summary>
internal sealed record SecureNowDependencyVersions(string Paths, string Ranking, string CutPoints, string Drift)
{
    public string ForStage(string stage) => stage switch
    {
        "securenow.ranking" => Ranking,
        "securenow.cut_point" => CutPoints,
        "securenow.drift" => Drift,
        _ => Paths
    };
}
