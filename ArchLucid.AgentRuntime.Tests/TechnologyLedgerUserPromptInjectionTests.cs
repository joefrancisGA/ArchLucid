using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerUserPromptInjectionTests
{
    [Fact]
    public void AppendLedgerContext_redacts_sensitive_technology_name_tokens()
    {
        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 1, 1, 0, 0, 0), DateTimeKind.Utc);
        List<TechnologyLedgerEntry> entries =
        [
            new()
            {
                RunId = "run-1",
                Role = TechnologyLedgerRole.Other,
                TechnologyName = "vm (Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret)",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.Evidence,
                EvidenceRef = "AKIAIOSFODNN7EXAMPLE",
                CreatedUtc = utc,
                UpdatedUtc = utc,
            },
        ];

        string prompt = TechnologyLedgerUserPromptInjection.AppendLedgerContext("Base prompt", entries);

        prompt.Should().Contain("Technology Ledger (canonical baseline for this run):");
        prompt.Should().NotContain("Bearer eyJ");
        prompt.Should().NotContain("AKIAIOSFODNN7EXAMPLE");
    }
}
