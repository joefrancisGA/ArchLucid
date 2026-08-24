namespace ArchLucid.Application.Architecture;

/// <summary>Outcome of <see cref="IArchitectureSynthesisKernel.GenerateAsync" />.</summary>
public sealed class ArchitectureSynthesisGenerateResult
{
    /// <summary>Optional draft identifier when generate is linked to a persisted draft.</summary>
    public string? DraftId
    {
        get;
        init;
    }

    /// <summary>Created-origin run id (32-character hex).</summary>
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Must be <c>ArchitecturePackageOrigin.Created</c>.</summary>
    public string PackageOrigin
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Persisted architecture knowledge model id when synthesis populated structured intake.</summary>
    public string? KnowledgeModelId
    {
        get;
        init;
    }
}
