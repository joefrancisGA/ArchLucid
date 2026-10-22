using System.Text.Json;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConsoleHangDiagnosticsTests : IDisposable
{
    public void Dispose()
    {
        ConsoleHangDiagnostics.UseLogger(null);
    }

    [Fact]
    public void FormatLine_includes_component_event_and_non_null_fields()
    {
        Dictionary<string, object?> fields = new()
        {
            ["draftId"] = Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c"),
            ["found"] = true,
            ["missing"] = null
        };

        string line = ConsoleHangDiagnostics.FormatLine(
            DraftGetHangDiagnostics.Component,
            "controller_get_draft_completed",
            fields);

        using JsonDocument document = JsonDocument.Parse(line);
        JsonElement root = document.RootElement;
        root.GetProperty("component").GetString().Should().Be("archlucid-api-draft-get-diag");
        root.GetProperty("event").GetString().Should().Be("controller_get_draft_completed");
        root.GetProperty("draftId").GetString().Should().Be("cf9ddef7-3a8b-4e10-aebb-79302e7c691c");
        root.GetProperty("found").GetBoolean().Should().BeTrue();
        root.TryGetProperty("missing", out _).Should().BeFalse();
    }

    [Fact]
    public void FormatLine_throws_when_component_is_blank()
    {
        Action act = () => ConsoleHangDiagnostics.FormatLine(" ", "event", new Dictionary<string, object?>());

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void LearningPlansHangDiagnostics_component_is_unchanged()
    {
        LearningPlansHangDiagnostics.Component.Should().Be("archlucid-api-learning-plans-diag");
    }

    [Fact]
    public void Log_with_null_logger_does_not_throw()
    {
        ConsoleHangDiagnostics.UseLogger(null);

        Action act = () => ConsoleHangDiagnostics.Log(
            DraftGetHangDiagnostics.Component,
            "controller_get_draft_entered",
            ("draftId", Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c")));

        act.Should().NotThrow();
    }

    [Fact]
    public void Log_with_null_logger_instance_does_not_throw()
    {
        ConsoleHangDiagnostics.UseLogger(NullLogger.Instance);

        Action act = () => ConsoleHangDiagnostics.Log(
            DraftGetHangDiagnostics.Component,
            "controller_get_draft_entered",
            ("draftId", Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c")));

        act.Should().NotThrow();
    }

    [Fact]
    public void Log_writes_json_through_logger_as_warning_without_format_exception()
    {
        List<(LogLevel Level, string Message)> entries = [];
        HangDiagnosticCollectingLogger logger = new(entries);
        ConsoleHangDiagnostics.UseLogger(logger);

        ConsoleHangDiagnostics.Log(
            DraftGetHangDiagnostics.Component,
            "controller_get_draft_entered",
            ("draftId", Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c")));

        entries.Should().ContainSingle();
        entries[0].Level.Should().Be(LogLevel.Warning);
        entries[0].Message.Should().Contain("archlucid-api-draft-get-diag");
        entries[0].Message.Should().Contain("controller_get_draft_entered");
        entries[0].Message.Should().Contain("cf9ddef7-3a8b-4e10-aebb-79302e7c691c");
        entries[0].Message.Should().StartWith("{");
    }
}
