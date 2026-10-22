namespace ArchLucid.Core.Runs.Finalization;

/// <summary>
///     Persistence fault from manifest finalization SQL (mapped to application exceptions at the use-case boundary).
/// </summary>
public sealed class ManifestFinalizationFaultException : Exception
{
    public ManifestFinalizationFaultException(
        ManifestFinalizationFaultKind kind,
        Guid runId,
        string message,
        Exception? innerException = null)
        : base(message, innerException)
    {
        Kind = kind;
        RunId = runId;
    }

    public ManifestFinalizationFaultKind Kind
    {
        get;
    }

    public Guid RunId
    {
        get;
    }
}
