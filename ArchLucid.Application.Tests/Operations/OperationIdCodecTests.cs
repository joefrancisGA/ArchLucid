using ArchLucid.Application.Operations;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class OperationIdCodecTests
{
    [Fact]
    public void ForJob_round_trips()
    {
        string operationId = OperationIdCodec.ForJob("abc123");

        OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload).Should().BeTrue();
        kind.Should().Be(OperationIdKind.Job);
        payload.Should().Be("abc123");
    }

    [Fact]
    public void ForRun_round_trips()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        string operationId = OperationIdCodec.ForRun(runId);

        OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload).Should().BeTrue();
        kind.Should().Be(OperationIdKind.Run);
        payload.Should().Be(runId.ToString("D"));
    }
}
