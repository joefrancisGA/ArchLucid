using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ExportRecordDiffExportServiceTests
{
    [Fact]
    public async Task GenerateDocxAsync_rejects_an_already_canceled_request()
    {
        ExportRecordDiffExportService service = new();
        using CancellationTokenSource cancellation = new();
        await cancellation.CancelAsync();

        OperationCanceledException exception = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => service.GenerateDocxAsync(new ExportRecordDiffResult(), cancellation.Token));

        Assert.Equal(cancellation.Token, exception.CancellationToken);
    }
}
