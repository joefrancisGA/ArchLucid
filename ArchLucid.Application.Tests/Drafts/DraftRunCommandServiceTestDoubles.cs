using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using Moq;
using Moq.Language;

namespace ArchLucid.Application.Tests.Drafts;

internal static class DraftRunCommandServiceTestDoubles
{
    internal static void SetupStandardReviewCreate(
        Mock<IArchitectureRunCommandService> mock,
        string runId = "abc123run",
        string requestId = "req123")
    {
        mock
            .Setup(static o => o.CreateRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunCommandResult
            {
                StandardResult = new CreateRunResult
                {
                    Run = new ArchitectureRun { RunId = runId, RequestId = requestId },
                },
            });
    }

    internal static void SetupCreateSequence(
        Mock<IArchitectureRunCommandService> mock,
        params (string RunId, string RequestId)[] runs)
    {
        ISetupSequentialResult<Task<CreateRunCommandResult>> sequence = mock.SetupSequence(static o => o.CreateRunAsync(
            It.IsAny<ScopeContext>(),
            It.IsAny<ArchitectureRequest>(),
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()));

        foreach ((string runId, string requestId) in runs)
        {
            sequence.ReturnsAsync(new CreateRunCommandResult
            {
                StandardResult = new CreateRunResult
                {
                    Run = new ArchitectureRun { RunId = runId, RequestId = requestId },
                },
            });
        }
    }
}
