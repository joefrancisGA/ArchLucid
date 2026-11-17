using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.OperationalErrors;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalErrorCaptureFailureTests
{
    [Fact]
    public void Capture_failure_does_not_escape_when_warning_logging_is_disabled()
    {
        InMemoryOperationalErrorCaptureQueue queue = new();
        Mock<IOptionsMonitor<OperationalErrorOptions>> options = new();
        options.SetupGet(x => x.CurrentValue).Returns(new OperationalErrorOptions
        {
            MaxMessageLength = -1
        });
        OperationalErrorCaptureService service = new(
            queue, options.Object, NullLogger<OperationalErrorCaptureService>.Instance);

        service.TryCapture(new OperationalErrorCaptureRequest
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            HttpStatusCode = 500
        });

        Assert.Equal(0, queue.ApproximatePendingCount);
    }
}
