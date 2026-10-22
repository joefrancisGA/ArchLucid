using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SanitizedLoggerEmailDispatchExtensionsTests
{
    [Fact]
    public void LogErrorTemplatedEmailSendFailed_logs_domain_only()
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

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        InvalidOperationException exception = new("smtp failed");

        SanitizedLoggerEmailDispatchExtensions.LogErrorTemplatedEmailSendFailed(
            mock.Object,
            exception,
            tenantId,
            "Weekly sponsor summary",
            "sponsor@example.com");

        rendered.Should().NotBeNull();
        string text = rendered!;

        text.Should().Contain("example.com");
        text.Should().Contain(tenantId.ToString());
        text.Should().NotContain("sponsor@");
    }

    [Fact]
    public void LogErrorRecurrenceEmailSendFailed_logs_domain_only()
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

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid scheduleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        InvalidOperationException exception = new("smtp failed");

        SanitizedLoggerEmailDispatchExtensions.LogErrorRecurrenceEmailSendFailed(
            mock.Object,
            exception,
            tenantId,
            scheduleId,
            "ops@example.net");

        rendered.Should().NotBeNull();
        string text = rendered!;

        text.Should().Contain("example.net");
        text.Should().Contain(scheduleId.ToString());
        text.Should().NotContain("ops@");
    }
}
