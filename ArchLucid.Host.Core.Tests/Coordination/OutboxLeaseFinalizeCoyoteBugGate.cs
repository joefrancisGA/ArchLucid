namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Prompt 15 Coyote DST bug injection toggle for the current test run.</summary>
internal static class OutboxLeaseFinalizeCoyoteBugGate
{
    public static bool InjectDoubleFinalizeBug { get; set; }
}
