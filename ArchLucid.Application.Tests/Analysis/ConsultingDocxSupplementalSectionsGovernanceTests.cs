using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxSupplementalSectionsGovernanceTests
{
    [Fact]
    public void AddArchitectureDetails_includes_relationships_when_datastores_are_empty()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Manifest = new GoldenManifest
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceName = "PaymentsApi",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "payments-api",
                        TargetId = "ledger-db",
                        RelationshipType = ArchLucid.Contracts.Common.RelationshipType.ReadsFrom,
                        Description = "Reads settlement rows",
                    },
                ],
            },
        };

        ConsultingDocxSupplementalSections.AddArchitectureDetails(body, report);

        string text = body.InnerText;

        text.Should().Contain("PaymentsApi");
        text.Should().Contain("Relationships");
        text.Should().Contain("payments-api");
        text.Should().Contain("ledger-db");
        text.Should().Contain("ReadsFrom");
        text.Should().Contain("Reads settlement rows");
    }
}
