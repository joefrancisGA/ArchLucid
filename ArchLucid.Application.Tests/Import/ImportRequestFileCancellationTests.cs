using ArchLucid.Application.Common;
using ArchLucid.Application.Import;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Import;

[Trait("Category", "Unit")]
public sealed class ImportRequestFileCancellationTests
{
    [Fact]
    public async Task ImportAsync_caller_cancellation_during_read_propagates()
    {
        using CancellationTokenSource caller = new();
        IFormFile file = CreateFile(ct =>
        {
            Assert.Equal(caller.Token, ct);
            caller.Cancel();
            return ValueTask.FromCanceled<int>(ct);
        });

        OperationCanceledException ex = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => CreateSut().ImportAsync(file, caller.Token));

        Assert.Equal(caller.Token, ex.CancellationToken);
    }

    [Fact]
    public async Task ImportAsync_unreadable_stream_remains_an_import_failure()
    {
        IFormFile file = CreateFile(_ => ValueTask.FromException<int>(new IOException("read failed")));

        ImportRequestFileResult result = await CreateSut().ImportAsync(file, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Could not read uploaded file as UTF-8 text.", result.FailureDetail);
    }

    private static ImportRequestFileService CreateSut() => new(
        new Mock<IScopeContextProvider>(MockBehavior.Strict).Object,
        new Mock<IActorContext>(MockBehavior.Strict).Object,
        new Mock<IAuditService>(MockBehavior.Strict).Object,
        new Mock<IImportedArchitectureRequestRepository>(MockBehavior.Strict).Object,
        new Mock<IArchitectureRequestImportValidator>(MockBehavior.Strict).Object,
        new Mock<IRequestContentSafetyPrecheck>(MockBehavior.Strict).Object,
        NullLogger<ImportRequestFileService>.Instance);

    private static IFormFile CreateFile(Func<CancellationToken, ValueTask<int>> read)
    {
        Mock<IFormFile> form = new(MockBehavior.Strict);
        form.SetupGet(file => file.FileName).Returns("architecture.json");
        form.SetupGet(file => file.Length).Returns(12);
        form.Setup(file => file.OpenReadStream()).Returns(() => new ControlledReadStream(read));
        return form.Object;
    }

    private sealed class ControlledReadStream(Func<CancellationToken, ValueTask<int>> read) : MemoryStream
    {
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
            => read(cancellationToken);
    }
}
