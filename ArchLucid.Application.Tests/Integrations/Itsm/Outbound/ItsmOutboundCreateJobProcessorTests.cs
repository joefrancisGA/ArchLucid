using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Category", "Unit")]
public sealed class ItsmOutboundCreateJobProcessorTests
{
    [Theory]
    [InlineData(ItsmOutboundIssueProvider.Jira, "Jira")]
    [InlineData(ItsmOutboundIssueProvider.ServiceNow, "ServiceNow")]
    [InlineData(ItsmOutboundIssueProvider.AzureBoards, "Azure Boards")]
    public void Correlation_save_failure_preserves_the_provider_and_existing_ticket_key(
        ItsmOutboundIssueProvider provider,
        string providerLabel)
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
            ExternalKey = "TEST-42",
        };

        ItsmOutboundCreateJobResult jobResult = ItsmOutboundCreateJobProcessor.ToJobResult(result, provider);
        BackgroundJobFile file = ItsmOutboundCreateJobProcessor.ToResultFile(jobResult);
        JsonSerializerOptions options = new() { PropertyNameCaseInsensitive = true };
        ItsmOutboundCreateJobResult? stored = JsonSerializer.Deserialize<ItsmOutboundCreateJobResult>(file.Bytes, options);

        Assert.NotNull(stored);
        Assert.Equal(ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed, stored.Kind);
        Assert.Equal("TEST-42", stored.ExternalKey);
        Assert.Equal(providerLabel, stored.Provider);
    }
}
