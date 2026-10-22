namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Prompt 5 / 15 invariants checked after every Coyote exploration step.</summary>
internal static class OutboxLeaseFinalizeCoyoteInvariants
{
    public static void Assert(OutboxLeaseFinalizeModel model)
    {
        if (model.FinalizeCount > 1)
            throw new InvalidOperationException("Invariant violated: never double-finalize.");

        if (model.PackageState is PackageSealState.Sealed && model.FinalizeCount != 1)
            throw new InvalidOperationException("Invariant violated: sealed package must reflect a single finalize.");

        if (model.PackageState is PackageSealState.Sealed && model.LeaseHeld)
            throw new InvalidOperationException("Invariant violated: sealed package must not hold an active lease.");
    }
}
