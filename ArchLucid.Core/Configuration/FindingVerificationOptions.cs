namespace ArchLucid.Core.Configuration;

/// <summary>ADR 0062 finding verification loop options (TB-2034).</summary>
public sealed class FindingVerificationOptions
{
    public const string SectionName = "FindingVerification";

    /// <summary>When true, POST /finding-verification?async=true enqueues a durable background job (202).</summary>
    public bool DurableAsyncEnabled
    {
        get;
        set;
    }

    /// <summary>Maximum dequeue retries for async verification jobs.</summary>
    public int AsyncMaxRetries
    {
        get;
        set;
    } = 3;
}
