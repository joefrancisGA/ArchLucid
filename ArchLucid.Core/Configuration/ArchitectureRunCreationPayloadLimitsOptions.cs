namespace ArchLucid.Core.Configuration;

/// <summary>
/// Byte-size guard for HTTP POST bodies on architecture-run creation ingestion endpoints.
/// </summary>
/// <remarks>
/// Paths are narrowed in middleware to architecture run creation only (not ZIP exports or batch replay).
/// <para>
/// Binding path uses <c>ArchLucid:ArchitectureRunCreation</c>, not <c>ArchLucid:ContextIngestion</c>: the substring
/// <c>ArchLucid.ContextIngestion</c> in IL literals is misread by NetArchTest as a forbidden reference from <c>ArchLucid.Core</c>.
/// </para>
/// </remarks>
public sealed class ArchitectureRunCreationPayloadLimitsOptions
{
    /// <summary>JSON configuration subtree under <c>ArchLucid:*</c> (colon-delimited).</summary>
    public const string SectionName = "ArchLucid:ArchitectureRunCreation";

    /// <summary>Flat key binding <see cref="MaxPayloadBytes"/> (colon-delimited).</summary>
    public const string MaxPayloadBytesKey = SectionName + ":MaxPayloadBytes";

    /// <summary>Maximum JSON body bytes for POST create-run endpoints. Default 10 MiB (10_485_760).</summary>
    public long MaxPayloadBytes
    {
        get;
        set;
    } = 10_485_760;
}
