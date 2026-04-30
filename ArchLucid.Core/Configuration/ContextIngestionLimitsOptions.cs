namespace ArchLucid.Core.Configuration;

/// <summary>
///     Byte-size guard for <see cref="F:Microsoft.AspNetCore.Http.Methods.Post" /> create-run ingestion bodies.
/// </summary>
/// <remarks>
///     Paths are narrowed in middleware to architecture run creation only (not ZIP exports or batch replay).
/// </remarks>
public sealed class ContextIngestionLimitsOptions
{
    public const string SectionName = "ArchLucid:ContextIngestion";

    /// <summary>Maximum JSON body bytes for POST create-run endpoints. Default 10 MiB (10_485_760).</summary>
    public long MaxPayloadBytes
    {
        get;
        set;
    } = 10_485_760;
}
