using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorReportFormatterTests
{
    [Fact]
    public void ToJson_returns_serialized_report_string()
    {
        StackDoctorReport report = SampleReport();

        string json = StackDoctorReportFormatter.ToJson(report);

        json.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void ToMarkdown_includes_step_table_and_escapes_pipe_characters()
    {
        StackDoctorReport report = new()
        {
            Profile = StackDoctorProfile.FirstPilotMinimum,
            RepositoryRoot = "C:\\repo",
            GeneratedUtc = new DateTime(2026, 7, 7, 12, 0, 0, DateTimeKind.Utc),
            OverallVerdict = StackDoctorVerdict.Warn,
            Steps =
            [
                new StackDoctorStepResult
                {
                    StepId = "lint",
                    DisplayName = "Config lint",
                    Verdict = StackDoctorVerdict.Warn,
                    Detail = "missing|value",
                },
            ],
        };

        string markdown = StackDoctorReportFormatter.ToMarkdown(report);

        markdown.Should().Contain("# Stack doctor report");
        markdown.Should().Contain("| Config lint | Warn | missing/value |");
    }

    [Fact]
    public void WriteConsoleSummary_writes_step_lines_to_stdout()
    {
        StackDoctorReport report = SampleReport();
        StringWriter writer = new();
        TextWriter previous = Console.Out;

        try
        {
            Console.SetOut(writer);

            StackDoctorReportFormatter.WriteConsoleSummary(report);
        }
        finally
        {
            Console.SetOut(previous);
        }

        string output = writer.ToString();

        output.Should().Contain("archlucid stack doctor");
        output.Should().Contain("[Pass   ] Config lint");
        output.Should().Contain("Overall: Pass");
    }

    private static StackDoctorReport SampleReport() =>
        new()
        {
            Profile = StackDoctorProfile.FirstPilotMinimum,
            RepositoryRoot = "C:\\repo",
            GeneratedUtc = new DateTime(2026, 7, 7, 12, 0, 0, DateTimeKind.Utc),
            OverallVerdict = StackDoctorVerdict.Pass,
            Steps =
            [
                new StackDoctorStepResult
                {
                    StepId = "lint",
                    DisplayName = "Config lint",
                    Verdict = StackDoctorVerdict.Pass,
                    Detail = "ok",
                    ArtifactPath = "artifacts/lint.json",
                },
            ],
        };
}
