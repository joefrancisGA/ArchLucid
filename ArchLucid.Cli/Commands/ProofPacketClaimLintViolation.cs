namespace ArchLucid.Cli.Commands;

/// <summary>One forbidden or unsupported buyer claim detected in a proof-packet artifact.</summary>
internal sealed record ProofPacketClaimLintViolation(
    string RelativeFilePath,
    int LineNumber,
    string Phrase,
    string Reason,
    string SuggestedSafeWording)
{
    public string RenderLine()
    {
        return $"{RelativeFilePath}:{LineNumber}: forbidden claim '{Phrase}' — {Reason} Suggested: {SuggestedSafeWording}";
    }
}
