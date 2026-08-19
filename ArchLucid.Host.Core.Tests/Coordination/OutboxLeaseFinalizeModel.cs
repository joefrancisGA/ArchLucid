namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>In-memory outbox lease + finalize protocol (Prompt 5 enumeration model).</summary>
public sealed class OutboxLeaseFinalizeModel
{
    public OutboxLeaseLifecycleState LifecycleState { get; private set; } = OutboxLeaseLifecycleState.Running;

    public PackageSealState PackageState { get; private set; } = PackageSealState.Unsealed;

    public bool LeaseHeld { get; private set; }

    public bool PersistBeforeLlm { get; private set; }

    public bool ReadyForFinalize { get; private set; }

    public int FinalizeCount { get; private set; }

    /// <summary>Coyote DST (Prompt 15): when true, simulates a double-finalize defect for systematic exploration.</summary>
    public bool CoyoteInjectDoubleFinalizeBug { get; set; }

    public DateTime? LastHeartbeatUtc { get; private set; }

    public OutboxLeaseTransitionResult TryApply(OutboxLeaseLifecycleEvent lifecycleEvent, DateTime utcNow)
    {
        switch (lifecycleEvent)
        {
            case OutboxLeaseLifecycleEvent.Lease:
                if (PackageState is PackageSealState.Sealed)
                    return Deny("Cannot lease work on a sealed package.");

                LeaseHeld = true;
                LastHeartbeatUtc = utcNow;
                LifecycleState = OutboxLeaseLifecycleState.Running;
                return Allow();

            case OutboxLeaseLifecycleEvent.Heartbeat:
                if (!LeaseHeld)
                    return Deny("Heartbeat without an active lease.");

                LastHeartbeatUtc = utcNow;
                return Allow();

            case OutboxLeaseLifecycleEvent.Crash:
                if (!LeaseHeld)
                    return Deny("Crash without an active lease.");

                LeaseHeld = false;
                LifecycleState = OutboxLeaseLifecycleState.Recovering;
                return Allow();

            case OutboxLeaseLifecycleEvent.Resume:
                if (PackageState is PackageSealState.Sealed)
                    return Deny("Cannot resume on a sealed package.");

                LeaseHeld = true;
                LastHeartbeatUtc = utcNow;
                LifecycleState = OutboxLeaseLifecycleState.Running;
                return Allow();

            case OutboxLeaseLifecycleEvent.Finalize:
                if (PackageState is PackageSealState.Sealed)
                {
                    if (CoyoteInjectDoubleFinalizeBug)
                    {
                        FinalizeCount++;
                        return Allow();
                    }

                    return Deny("Never double-finalize.");
                }

                if (!PersistBeforeLlm)
                    return Deny("Finalize rejected without persist-before-LLM.");

                if (!ReadyForFinalize)
                {
                    LifecycleState = OutboxLeaseLifecycleState.Partial;
                    return Deny("Finalize rejected while not ready.");
                }

                FinalizeCount++;
                PackageState = PackageSealState.Sealed;
                LeaseHeld = false;
                LifecycleState = OutboxLeaseLifecycleState.Ready;
                return Allow();

            case OutboxLeaseLifecycleEvent.LateWrite:
                if (PackageState is PackageSealState.Sealed)
                    return Deny("Late worker write on sealed package is forbidden.");

                return Allow();

            default:
                return Deny("Unknown lifecycle event.");
        }
    }

    public bool IsLeaseZombie(DateTime utcNow, TimeSpan heartbeatTimeout)
    {
        if (!LeaseHeld || LastHeartbeatUtc is null)
            return false;

        return utcNow - LastHeartbeatUtc.Value > heartbeatTimeout;
    }

    public void MarkPersistedBeforeLlm() => PersistBeforeLlm = true;

    public void MarkReadyForFinalize() => ReadyForFinalize = true;

    private static OutboxLeaseTransitionResult Allow() => new(true, null);

    private static OutboxLeaseTransitionResult Deny(string reason) => new(false, reason);
}

public enum OutboxLeaseLifecycleState
{
    Running = 1,
    Recovering = 2,
    Partial = 3,
    Ready = 4,
    NeedsAttention = 5,
}

public enum PackageSealState
{
    Unsealed = 1,
    Sealed = 2,
}

public enum OutboxLeaseLifecycleEvent
{
    Lease = 1,
    Heartbeat = 2,
    Crash = 3,
    Resume = 4,
    Finalize = 5,
    LateWrite = 6,
}

public readonly record struct OutboxLeaseTransitionResult(bool IsAllowed, string? DenialReason);
