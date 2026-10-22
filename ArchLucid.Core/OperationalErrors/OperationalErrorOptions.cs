namespace ArchLucid.Core.OperationalErrors;

/// <summary>Configuration for platform operational error capture and retention.</summary>
public sealed class OperationalErrorOptions
{
    public const string SectionName = "OperationalErrors";

    public bool Enabled
    {
        get;
        set;
    } = true;

    public int MinHttpStatusCode
    {
        get;
        set;
    } = 400;

    public string[] ExcludePathPrefixes
    {
        get;
        set;
    } =
    [
        "/health",
        "/metrics",
        "/openapi",
        "/scalar"
    ];

    public int MaxMessageLength
    {
        get;
        set;
    } = 2000;

    public int MaxStackTraceLength
    {
        get;
        set;
    } = 16000;

    public int RetentionDays
    {
        get;
        set;
    } = 90;

    public int MaxRowsPerSearch
    {
        get;
        set;
    } = 500;

    public int QueueCapacity
    {
        get;
        set;
    } = 2000;

    /// <summary>Maximum rows captured per fingerprint per minute; 0 disables throttling.</summary>
    public int MaxCapturesPerFingerprintPerMinute
    {
        get;
        set;
    } = 60;

    public int RetentionPurgeBatchSize
    {
        get;
        set;
    } = 1000;
}
