using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimeLifecycleAssessmentTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 12, 0, 0, TimeSpan.Zero);
    private static RuntimeObservation Observation() => new("resource", "php", "php", "upstream",
        "8.4.2", RuntimeEvidenceKind.Executing, "observation", Now.AddMinutes(-1),
        new Dictionary<string, RuntimePrerequisiteState>());
    private static VerifiedRuntimeLifecycle Lifecycle() => new("php", "php", "upstream", "8.4",
        Now.AddDays(1), Now.AddDays(30), Now.AddDays(-1), Now.AddDays(1), "vendor-proof");

    [Fact]
    public void Evaluates_support_boundaries()
    {
        var lifecycle = Lifecycle();
        Assert.Equal(RuntimeLifecycleStatus.Supported, Assess(Observation(), lifecycle));
        Assert.Equal(RuntimeLifecycleStatus.ExtendedSupport, Assess(Observation(),
            lifecycle with { StandardSupportEnds = Now }));
        Assert.Equal(RuntimeLifecycleStatus.EndOfSupport, Assess(Observation(),
            lifecycle with { StandardSupportEnds = Now.AddDays(-1), ExtendedSupportEnds = Now }));
        Assert.Equal(RuntimeLifecycleStatus.EndOfSupport, Assess(Observation(),
            lifecycle with { StandardSupportEnds = Now, ExtendedSupportEnds = null }));
    }

    [Fact]
    public void Unverified_or_mismatched_evidence_is_unknown()
    {
        var observation = Observation();
        var lifecycle = Lifecycle();
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation with { Kind = RuntimeEvidenceKind.Configured }, lifecycle));
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation with { ObservedAt = Now.AddHours(-1) }, lifecycle));
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation with { Distribution = "other" }, lifecycle));
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation with { Version = "8.3.9" }, lifecycle));
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation, lifecycle with { ValidUntil = Now }));
        Assert.Equal(RuntimeLifecycleStatus.Unknown, Assess(observation,
            lifecycle with { ExtendedSupportEnds = Now.AddDays(-1) }));
    }

    private static RuntimeLifecycleStatus Assess(RuntimeObservation observation, VerifiedRuntimeLifecycle lifecycle) =>
        RuntimeLifecycleAssessment.Assess(observation, lifecycle, Now, TimeSpan.FromMinutes(5));
}
