using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecureNowQuestionResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_answer_codes_yields_empty_list_not_null()
    {
        Guid snapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string json = $$"""
            {
              "snapshotId": "{{snapshotId}}",
              "subscriptionId": "sub",
              "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
              "questionKey": "q1",
              "source": "securenow",
              "scopeKind": "resource",
              "status": "open",
              "questionText": "text",
              "resourceType": "Microsoft.Storage/storageAccounts",
              "resourceName": "sa",
              "reasonText": "reason",
              "sourceLine": "line",
              "answerCodes": null,
              "evidenceFingerprint": "fp",
              "isExpired": false
            }
            """;

        SecureNowQuestionResponse? response =
            JsonSerializer.Deserialize<SecureNowQuestionResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.AnswerCodes.Should().NotBeNull();
        response.AnswerCodes.Should().BeEmpty();
    }
}
