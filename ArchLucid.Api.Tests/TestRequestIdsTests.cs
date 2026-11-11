namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class TestRequestIdsTests
{
    [Fact]
    public void ForScenario_preserves_short_readable_identifiers()
    {
        Assert.Equal("REQ-GOVERNANCE-APPROVE", TestRequestIds.ForScenario("Governance", "Approve"));
    }

    [Fact]
    public void ForScenario_long_test_names_fit_intake_and_keep_distinct_review_names()
    {
        const string methodPrefix = "ReviewOfSerializedPinEvidenceAndAuditTrailFor";
        string approval = TestRequestIds.ForScenario("GovernanceControllerTests", methodPrefix + "Approval");
        string rejection = TestRequestIds.ForScenario("GovernanceControllerTests", methodPrefix + "Rejection");

        Assert.True(approval.Length <= 48);
        Assert.True(rejection.Length <= 48);
        Assert.NotEqual(approval, rejection);
        Assert.NotEqual(
            TestRequestFactory.SystemNameForRequest(approval),
            TestRequestFactory.SystemNameForRequest(rejection));
    }

    [Fact]
    public void ForScenario_long_test_name_is_deterministic()
    {
        const string method = "CreateReviewWithLongNameAndLegitimateTenantScopedEvidence";
        string first = TestRequestIds.ForScenario("ArchitectureIntegrationRegressionTests", method);
        string second = TestRequestIds.ForScenario("ArchitectureIntegrationRegressionTests", method);

        Assert.Equal(first, second);
    }
}
