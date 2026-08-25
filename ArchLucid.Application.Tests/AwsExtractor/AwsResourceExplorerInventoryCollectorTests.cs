using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;

using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsResourceExplorerInventoryCollectorTests
{
    [Fact]
    public async Task SearchResourcesAsync_paginates_until_next_token_exhausted()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == null),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource { Arn = "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-1", ResourceType = "AWS::EC2::VPC" }
                ],
                NextToken = "page-2"
            });

        explorerClient
            .Setup(c => c.SearchAsync(
                It.Is<SearchRequest>(r => r.NextToken == "page-2"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources = [
                    new Resource
                    {
                        Arn = "arn:aws:s3:::bucket-1",
                        ResourceType = "AWS::S3::Bucket"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().HaveCount(2);
        resources[0].Name.Should().Contain("vpc-1");
        resources[1].Name.Should().Contain("bucket-1");

        explorerClient.Verify(
            c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task CollectAsync_uses_resource_region_not_connection_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse
            {
                Resources =
                [
                    new Resource
                    {
                        Arn = "arn:aws:ec2:eu-west-1:123456789012:instance/i-abc",
                        ResourceType = "AWS::EC2::Instance",
                        Region = "eu-west-1"
                    }
                ],
                NextToken = null
            });

        List<AwsInventoryResourceEntry> resources = await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("eu-west-1");
    }

    [Fact]
    public async Task CollectAsync_uses_govcloud_partition_query_for_us_gov_region()
    {
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        string? capturedQuery = null;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SearchRequest, CancellationToken>((request, _) => capturedQuery = request.QueryString)
            .ReturnsAsync(new SearchResponse
            {
                Resources = [],
                NextToken = null
            });

        await AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-gov-west-1",
            CancellationToken.None);

        capturedQuery.Should().Be("arn:aws-us-gov:*");
    }

    [Fact]
    public async Task CollectAsync_throws_when_next_token_repeats()
    {
        const string repeatingToken = "repeat-token";
        Mock<IAmazonResourceExplorer2> explorerClient = new();
        int requestCount = 0;

        explorerClient
            .Setup(c => c.SearchAsync(It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current > 3)
                {
                    throw new InvalidOperationException(
                        "Test hang guard: AWS Resource Explorer listing did not stop on repeating NextToken.");
                }

                return new SearchResponse
                {
                    Resources =
                    [
                        new Resource
                        {
                            Arn = "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-1",
                            ResourceType = "AWS::EC2::VPC"
                        }
                    ],
                    NextToken = repeatingToken
                };
            });

        Func<Task> act = () => AwsResourceExplorerInventoryCollector.CollectAsync(
            explorerClient.Object,
            "us-east-1",
            CancellationToken.None);

        InvalidOperationException exception = (await act.Should().ThrowAsync<InvalidOperationException>()).Which;

        exception.Message.Should().ContainEquivalentOf("repeating NextToken");
        requestCount.Should().Be(2);
    }
}
