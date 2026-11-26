using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RuntimePatchEvidenceEvaluatorTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(1);

    private static RuntimeInstanceScope Scope(bool complete = true) =>
        new("tenant", "/app/slots/blue", "Java", ["instance-1", "instance-2"], Now, true, complete);

    private static RuntimeVersionEvidence Observation(
        string instance = "instance-1", string version = "17.0.21.1",
        RuntimeEvidenceKind kind = RuntimeEvidenceKind.Executing) =>
        new("tenant", "/app/slots/blue", instance, "Java", kind, version, Now, true);

    private static RuntimePatchStatus Evaluate(params RuntimeVersionEvidence[] observations) =>
        RuntimePatchEvidenceEvaluator.Evaluate(Scope(), "17.0.21.1", observations, Now, MaxAge).Status;

    [Fact]
    public void Complete_verified_executing_scope_is_compliant()
    {
        Assert.Equal(RuntimePatchStatus.Compliant,
            Evaluate(Observation(), Observation("instance-2", "17.0.22")));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(3)]
    public void Non_executing_evidence_is_unknown(int value)
    {
        RuntimeEvidenceKind kind = (RuntimeEvidenceKind)value;
        Assert.Equal(RuntimePatchStatus.Unknown,
            Evaluate(Observation(kind: kind), Observation("instance-2", kind: kind)));
    }

    [Fact]
    public void Missing_instance_is_unknown()
    {
        Assert.Equal(RuntimePatchStatus.Unknown, Evaluate(Observation()));
        Assert.Equal(RuntimePatchStatus.Unknown, Evaluate());
    }

    [Fact]
    public void Verified_vulnerable_instance_prevents_compliance_even_when_scope_incomplete()
    {
        Assert.Equal(RuntimePatchStatus.NonCompliant,
            RuntimePatchEvidenceEvaluator.Evaluate(Scope(false), "17.0.21.1",
                [Observation(version: "17.0.21")], Now, MaxAge).Status);
    }

    [Fact]
    public void Incomplete_or_unverified_scope_cannot_be_compliant()
    {
        RuntimeVersionEvidence[] evidence = [Observation(), Observation("instance-2")];
        Assert.Equal(RuntimePatchStatus.Unknown,
            RuntimePatchEvidenceEvaluator.Evaluate(Scope(false), "17.0.21.1", evidence, Now, MaxAge).Status);
        Assert.Equal(RuntimePatchStatus.Unknown,
            RuntimePatchEvidenceEvaluator.Evaluate(Scope() with { Verified = false },
                "17.0.21.1", evidence, Now, MaxAge).Status);
    }

    [Fact]
    public void Stale_future_foreign_and_unverified_observations_are_unknown()
    {
        RuntimeVersionEvidence[] invalid =
        [
            Observation() with { ObservedAt = Now.AddHours(-2) },
            Observation() with { ObservedAt = Now.AddMinutes(-1) },
            Observation() with { ObservedAt = Now.AddMinutes(1) },
            Observation() with { TenantId = "other" },
            Observation() with { ResourceId = "/app/slots/green" },
            Observation() with { RuntimeFamily = "NGINX" },
            Observation() with { Verified = false },
            Observation() with { InstanceId = "previous-deployment" },
        ];

        foreach (RuntimeVersionEvidence item in invalid)
        {
            Assert.Equal(RuntimePatchStatus.Unknown, Evaluate(item, Observation("instance-2")));
        }
    }

    [Theory]
    [InlineData("17")]
    [InlineData("17.0.21-ea")]
    [InlineData("21.0.13.1")]
    [InlineData("17.1.0")]
    [InlineData("17.2.99")]
    [InlineData("invalid")]
    public void Unsupported_version_or_release_line_is_unknown(string version)
    {
        Assert.Equal(RuntimePatchStatus.Unknown,
            Evaluate(Observation(version: version), Observation("instance-2")));
    }

    [Fact]
    public void Conflicting_latest_observations_are_unknown()
    {
        Assert.Equal(RuntimePatchStatus.Unknown,
            Evaluate(Observation(), Observation(version: "17.0.20"), Observation("instance-2")));
    }
}
