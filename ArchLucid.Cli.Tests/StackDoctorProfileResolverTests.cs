using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorProfileResolverTests
{
    [Theory]
    [InlineData("dev", StackDoctorProfile.FirstPilotMinimum)]
    [InlineData("pilot", StackDoctorProfile.FirstPilotMinimum)]
    [InlineData("staging", StackDoctorProfile.StagingRealLlm)]
    [InlineData("production", StackDoctorProfile.ProductionLike)]
    public void MapStackEnvironment_MapsKnownValues(string environment, string expectedProfile)
    {
        StackDoctorProfileResolver.MapStackEnvironment(environment).Should().Be(expectedProfile);
    }

    [Fact]
    public void TryResolveFromAnswersFile_returns_error_when_environment_is_blank()
    {
        string answersPath = WriteAnswersYaml(
            """
            schemaVersion: 1
            azure:
              subscriptionId: 8aa56f3b-18bc-43ca-ad45-bad9e811d33b
              tenantId: 00000000-0000-0000-0000-000000000001
              location: eastus2
              environment: "   "
            """);

        try
        {
            bool ok = StackDoctorProfileResolver.TryResolveFromAnswersFile(answersPath, out string profile, out string? error);

            ok.Should().BeFalse();
            profile.Should().BeEmpty();
            error.Should().Contain("azure.environment is empty");
        }
        finally
        {
            File.Delete(answersPath);
        }
    }

    [Fact]
    public void TryResolveFromAnswersFile_maps_answers_file_environment()
    {
        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot(AppContext.BaseDirectory);
        repoRoot.Should().NotBeNull();

        string examplePath = Path.Combine(repoRoot!, "deploy", "archlucid.stack.example.yaml");
        File.Exists(examplePath).Should().BeTrue();

        bool ok = StackDoctorProfileResolver.TryResolveFromAnswersFile(examplePath, out string profile, out string? error);

        ok.Should().BeTrue(error);
        profile.Should().Be(StackDoctorProfile.FirstPilotMinimum);
    }

    private static string WriteAnswersYaml(string content)
    {
        string path = Path.Combine(Path.GetTempPath(), "archlucid-stack-" + Guid.NewGuid().ToString("N") + ".yaml");
        File.WriteAllText(path, content);

        return path;
    }
}
