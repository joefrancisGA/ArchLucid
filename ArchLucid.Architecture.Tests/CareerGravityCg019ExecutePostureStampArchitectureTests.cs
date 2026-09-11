using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-019 ratchet: execute start stamps Working door + captured UTC on the run header.
/// Career honesty reads the stamp. Does not rewrite ADR 0078 or ManifestHash rules.
/// Host AgentExecution default stays Simulator (no G-REAL-06).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg019ExecutePostureStampArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg019_sql_and_run_record_persist_working_door_stamp()
    {
        string ddl = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql"));
        string migration = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations", "390_Runs_ExecutePostureStamp.sql"));
        string runRecord = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Persistence",
                "ApplicationPorts",
                "Models",
                "RunRecord.cs"));
        string registry = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Persistence", "CommittedRunHeaderAnchorRegistry.cs"));

        ddl.Should().Contain("WorkingCareerRehearsalDoor");
        ddl.Should().Contain("ExecutePostureCapturedUtc");
        ddl.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migration.Should().Contain("WorkingCareerRehearsalDoor");
        migration.Should().Contain("ExecutePostureCapturedUtc");
        migration.Should().Contain("TR_Runs_SealCommittedHeader");
        runRecord.Should().Contain("WorkingCareerRehearsalDoor");
        runRecord.Should().Contain("ExecutePostureCapturedUtc");
        registry.Should().Contain("WorkingCareerRehearsalDoor");
        registry.Should().Contain("ExecutePostureCapturedUtc");
    }

    [Fact]
    public void Cg019_capture_service_stamps_before_agent_loop_and_does_not_rewrite_honesty_validator()
    {
        string capture = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ExecuteTimeCareerPostureCaptureService.cs"));
        string tailHooks = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Execute",
                "ArchitectureRunExecuteTailHooksStage.cs"));
        string validatorPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Decisioning",
            "CareerArtifacts",
            "CareerArtifactCompletenessValidator.cs");
        string adr0078Path = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "adrs",
            "0078-career-artifact-honesty-contract.md");

        File.Exists(validatorPath).Should().BeTrue();
        File.Exists(adr0078Path).Should().BeTrue();
        capture.Should().Contain("ExecutePostureCapturedUtc");
        capture.Should().Contain("WorkingCareerRehearsalDoorValues.ParseOrDefault");
        capture.Should().Contain("GoldenManifestId");
        capture.Should().NotContain("ManifestHash");
        capture.Should().NotContain("G-REAL-06");
        tailHooks.Should().Contain("IExecuteTimeCareerPostureCaptureService");
        tailHooks.Should().Contain("TryCaptureAndPersistAsync");
        File.ReadAllText(validatorPath).Should().NotContain("IExecuteTimeCareerPostureCaptureService");
    }

    [Fact]
    public void Cg019_does_not_flip_host_execute_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string capture = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "ExecuteTimeCareerPostureCaptureService.cs"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        capture.Should().NotContain("G-REAL-06");
        capture.Should().NotContain("AgentExecution:Mode");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
