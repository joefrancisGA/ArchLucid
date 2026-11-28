using System.Security.Cryptography;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using static ArchLucid.Application.Analysis.OptionalIntermediateArtifact;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OptionalIntermediateArtifactTests
{
    [Fact]
    public void Bytes_require_the_exact_scoped_stage_input_schema_and_producer()
    {
        DateTimeOffset now = new(2026, 11, 28, 0, 0, 0, TimeSpan.Zero);
        AnalysisRecoveryStageKey stage = new(
            ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()),
            "authority", Guid.NewGuid(), "diagram");
        byte[] payload = [1, 2, 3];
        Reference valid = new(stage, "input-pin", "build-id", Convert.ToHexString(SHA256.HashData(payload)),
            payload.Length, FormatVersion, now.AddHours(1));

        Assert.Equal(Disposition.Usable, Validate(valid, stage, "input-pin", "build-id", payload, 3, now));
        Assert.Equal(Disposition.Missing, Validate(valid, stage, "input-pin", "build-id", [], 3, now));
        Assert.Equal(Disposition.Incompatible,
            Validate(valid with { Format = 99 }, stage, "input-pin", "build-id", payload, 3, now));
        Assert.Equal(Disposition.Incompatible,
            Validate(valid, stage with { Scope = ProjectScopeKey.Create(stage.Scope.TenantId, stage.Scope.WorkspaceId, Guid.NewGuid()) },
                "input-pin", "build-id", payload, 3, now));
        Assert.Equal(Disposition.Incompatible,
            Validate(valid, stage with { RunId = Guid.NewGuid() }, "input-pin", "build-id", payload, 3, now));
        Assert.Equal(Disposition.Incompatible, Validate(valid, stage, "new-input", "build-id", payload, 3, now));
        Assert.Equal(Disposition.Incompatible, Validate(valid, stage, "input-pin", "new-build", payload, 3, now));
        Assert.Equal(Disposition.Expired, Validate(valid, stage, "input-pin", "build-id", payload, 3, now.AddHours(1)));
        Assert.Equal(Disposition.OutsideBudget, Validate(valid, stage, "input-pin", "build-id", payload, 2, now));
        Assert.Equal(Disposition.InvalidContent, Validate(valid, stage, "input-pin", "build-id", [1, 3, 2], 3, now));
    }
}
