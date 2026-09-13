namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed class DiagramForestLayoutResult
{
    public static DiagramForestLayoutResult Failed(string error)
    {
        return new DiagramForestLayoutResult
        {
            Succeeded = false,
            Error = error,
        };
    }

    public bool Succeeded
    {
        get;
        init;
    }

    public string? Svg
    {
        get;
        init;
    }

    public string? Error
    {
        get;
        init;
    }
}
