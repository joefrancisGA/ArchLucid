using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SanitizedLoggerSupportProblemReportExtensionsTests
{
    [Fact]
    public void LogInformationProblemReportAckWouldSend_logs_domain_only()
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
                Delegate formatter = (Delegate)invocation.Arguments[4];
                object state = invocation.Arguments[2];
                object ex = invocation.Arguments[3];
                rendered = formatter.DynamicInvoke(state, ex) as string;
            }));

        Guid reportId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        SanitizedLoggerSupportProblemReportExtensions.LogInformationProblemReportAckWouldSend(
            mock.Object,
            reportId,
            "reporter@example.com",
            "Noop");

        rendered.Should().NotBeNull();
        string text = rendered!;

        text.Should().Contain("example.com");
        text.Should().Contain(reportId.ToString());
        text.Should().NotContain("reporter@");
    }
}
