namespace ArchLucid.Core.OperationalErrors;

/// <summary>Host surface that produced the operational error row.</summary>
public static class OperationalErrorSource
{
    public const string Api = "Api";

    public const string Worker = "Worker";

    public const string BackgroundJob = "BackgroundJob";
}
