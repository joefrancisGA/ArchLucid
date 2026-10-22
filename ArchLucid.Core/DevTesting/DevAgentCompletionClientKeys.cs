namespace ArchLucid.Core.DevTesting;

/// <summary>Keyed DI service names for dev-only completion client switching.</summary>
public static class DevAgentCompletionClientKeys
{
    /// <summary>Offline deterministic completion client used when effective mode is Simulator.</summary>
    public const string Simulator = "DevAgentCompletion.Simulator";
}
