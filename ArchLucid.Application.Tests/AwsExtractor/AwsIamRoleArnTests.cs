using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsIamRoleArnTests
{
    [Fact]
    public void TryGetAccountId_accepts_aws_us_gov_partition_role_arn()
    {
        const string roleArn = "arn:aws-us-gov:iam::123456789012:role/ArchLucidReadOnly";

        bool parsed = AwsIamRoleArn.TryGetAccountId(roleArn, out string accountId);

        parsed.Should().BeTrue();
        accountId.Should().Be("123456789012");
    }

    [Fact]
    public void EnsureAccountMatches_accepts_matching_govcloud_role_arn()
    {
        const string accountId = "123456789012";
        const string roleArn = "arn:aws-us-gov:iam::123456789012:role/ArchLucidReadOnly";

        Action act = () => AwsIamRoleArn.EnsureAccountMatches(accountId, roleArn);

        act.Should().NotThrow();
    }
}
