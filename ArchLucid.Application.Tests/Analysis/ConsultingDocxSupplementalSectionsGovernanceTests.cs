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

    [Fact]
    public void AddArchitectureDetails_labels_blank_service_datastore_and_relationship_fields()
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
                        ServiceName = " ",
                        ServiceType = ServiceType.Unknown,
                        RuntimePlatform = RuntimePlatform.Unknown,
                    },
                ],
                Datastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "",
                        DatastoreType = DatastoreType.Unknown,
                        RuntimePlatform = RuntimePlatform.Unknown,
                    },
                ],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc",
                        TargetId = "db",
                        RelationshipType = ArchLucid.Contracts.Common.RelationshipType.Calls,
                        Description = " ",
                    },
                ],
            },
        };

        ConsultingDocxSupplementalSections.AddArchitectureDetails(body, report);

        string text = body.InnerText;

        text.Should().Contain(ConsultingDocxGovernanceHonestyCopy.ServiceNameNotStored);
        text.Should().Contain(ConsultingDocxGovernanceHonestyCopy.ServicePurposeNotStored);
        text.Should().Contain(ConsultingDocxGovernanceHonestyCopy.ServiceRequiredControlsNotStored);
        text.Should().Contain(ConsultingDocxGovernanceHonestyCopy.DatastoreNameNotStored);
        text.Should().Contain(ConsultingDocxGovernanceHonestyCopy.RelationshipDescriptionNotStored);
    }
}
