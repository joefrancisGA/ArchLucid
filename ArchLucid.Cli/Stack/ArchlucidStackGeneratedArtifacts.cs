namespace ArchLucid.Cli.Stack;

/// <summary>Generated TB-654 deployment artifacts keyed by relative output path.</summary>
internal sealed class ArchlucidStackGeneratedArtifacts
{
    public ArchlucidStackGeneratedArtifacts(IReadOnlyDictionary<string, string> filesByRelativePath)
    {
        FilesByRelativePath = filesByRelativePath;
    }

    public IReadOnlyDictionary<string, string> FilesByRelativePath
    {
        get;
    }
}
