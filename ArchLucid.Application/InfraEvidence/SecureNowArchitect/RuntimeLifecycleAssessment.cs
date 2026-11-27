namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class RuntimeLifecycleAssessment
{
    public static RuntimeLifecycleStatus Assess(RuntimeObservation observation,
        VerifiedRuntimeLifecycle lifecycle, DateTimeOffset now, TimeSpan maximumAge)
    {
        if (observation.Kind != RuntimeEvidenceKind.Executing || maximumAge <= TimeSpan.Zero ||
            observation.ObservedAt > now || now - observation.ObservedAt > maximumAge ||
            lifecycle.VerifiedAt > now || lifecycle.ValidUntil <= now ||
            lifecycle.ValidUntil <= lifecycle.VerifiedAt ||
            string.IsNullOrWhiteSpace(observation.EvidenceId) || string.IsNullOrWhiteSpace(lifecycle.EvidenceId) ||
            !string.Equals(observation.Product, lifecycle.Product, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(observation.Vendor, lifecycle.Vendor, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(observation.Distribution, lifecycle.Distribution, StringComparison.OrdinalIgnoreCase) ||
            lifecycle.ExtendedSupportEnds is DateTimeOffset extended && extended < lifecycle.StandardSupportEnds)
            return RuntimeLifecycleStatus.Unknown;

        if (!Version.TryParse(observation.Version, out var version) || version.Build < 0 ||
            !string.Equals(lifecycle.ReleaseLine, $"{version.Major}.{version.Minor}", StringComparison.Ordinal))
            return RuntimeLifecycleStatus.Unknown;

        if (now < lifecycle.StandardSupportEnds) return RuntimeLifecycleStatus.Supported;

        if (lifecycle.ExtendedSupportEnds is DateTimeOffset end && now < end)
            return RuntimeLifecycleStatus.ExtendedSupport;
        return RuntimeLifecycleStatus.EndOfSupport;
    }
}
