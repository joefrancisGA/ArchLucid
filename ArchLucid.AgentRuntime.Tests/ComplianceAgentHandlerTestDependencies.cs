using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

internal static class ComplianceAgentHandlerTestDependencies
{
    internal static IRetrievalQueryService CreateEmptyRetrievalQueryService()
    {
        Mock<IRetrievalQueryService> retrieval = new();
        retrieval.Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return retrieval.Object;
    }

    internal static ILogger<ComplianceAgentHandler> CreateNullLogger() =>
        NullLogger<ComplianceAgentHandler>.Instance;
}
