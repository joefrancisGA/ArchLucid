using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SanitizedLoggerWarningExtensionsTests
{
    [Fact]
    public void LogWarningWithTwoSanitizedUserStrings_strips_control_chars()
    {
        Mock<ILogger> mock = new();
        mock.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        string? rendered = null;

        mock.Setup(m => m.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(new InvocationAction(invocation =>
            {
                Delegate formatter = (Delegate)invocation.Arguments[4]!;
                object state = invocation.Arguments[2]!;
                object? ex = invocation.Arguments[3];
                rendered = formatter.DynamicInvoke(state, ex) as string;
            }));

        mock.Object.LogWarningWithTwoSanitizedUserStrings(
            "Run {RunId}: {Gaps}",
            "run\nid",
            "a\tb");

        rendered.Should().NotBeNull();
        string text = rendered!;

        text.Should().Contain("run_id");
        text.Should().Contain("a_b");
        text.Should().NotContain("\n");
        text.Should().NotContain("\t");
    }

    [Fact]
    public void LogWarningWithTwoSanitizedUserStrings_throws_when_logger_null()
    {
        ILogger logger = null!;

        Action act = () => logger.LogWarningWithTwoSanitizedUserStrings("x {A} {B}", "a", "b");

        act.Should().Throw<ArgumentNullException>().WithParameterName("logger");
    }
}
