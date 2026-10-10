using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LivelihoodGradeNoLn004FalseHardValidatorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Ln004_validator_wired_into_career_artifact_completeness()
    {
        string validator = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Decisioning/CareerArtifacts/CareerArtifactCompletenessValidator.cs");
        string dedicated = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Decisioning/CareerArtifacts/WorkingCareerHardInfeasibleCitationValidator.cs");
        string mapper = ArchitectureSourceProbe.ReadCsTypeFamily("ArchLucid.Application/Exports/CareerArtifactCompletenessInputMapper.cs");

        dedicated.Should().Contain("LN-004");
        validator.Should().Contain("EvaluateUncitedHardInfeasible");
        validator.Should().Contain("WorkingCareerHardInfeasibleCitationValidator");
        mapper.Should().Contain("FeasibilityVerdict: input.CoverageContext.Verdict");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
