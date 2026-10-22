using ArchLucid.Application.Analysis;
using ArchLucid.Core.Audit;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportBlobPushServiceTests
{
    [Fact]
    public async Task PushAsync_throws_when_destination_is_not_azure_blob_https()
    {
        RunExportBlobPushService sut = new(
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<IAuditService>(),
            NullLogger<RunExportBlobPushService>.Instance);

        Func<Task> act = () => sut.PushAsync(
            Guid.NewGuid(),
            [0x50, 0x4b],
            "https://127.0.0.1/evil?sas=token",
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*private*");
    }
}
