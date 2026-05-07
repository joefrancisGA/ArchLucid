namespace ArchLucid.Application.ExecDigest;
/// <summary>One committed manifest run highlighted in the digest (significance = proxy score from pilot deltas).</summary>
public sealed record ExecDigestHighlightedRun(string RunIdHex, int SignificanceScore, string? Caption)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(RunIdHex, Caption);
    private static byte __ValidatePrimaryConstructorArguments(System.String runIdHex, System.String? caption)
    {
        ArgumentNullException.ThrowIfNull(runIdHex);
        return (byte)0;
    }
}