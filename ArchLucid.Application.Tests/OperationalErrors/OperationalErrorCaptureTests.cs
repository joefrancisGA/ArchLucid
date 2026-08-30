using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Application.Tests.OperationalErrors;

[Trait("Category", "Unit")]
public sealed class OperationalErrorPathExclusionTests
{
    [Theory]
    [InlineData("/health/ready", true)]
    [InlineData("/metrics", true)]
    [InlineData("/openapi/v1.json", true)]
    [InlineData("/v1/runs", false)]
    public void IsExcluded_matches_configured_prefixes(string path, bool expected)
    {
        string[] prefixes = ["/health", "/metrics", "/openapi", "/scalar"];

        OperationalErrorPathExclusion.IsExcluded(path, prefixes).Should().Be(expected);
    }
}

[Trait("Category", "Unit")]
public sealed class OperationalErrorRecordBuilderTests
{
    [Fact]
    public void Build_marks_sql_exception_as_database_error()
    {
        Microsoft.Data.SqlClient.SqlException sqlException = SqlExceptionTestFactory.Create(-2);

        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            Exception = sqlException,
            HttpStatusCode = 503
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        record.Category.Should().Be(OperationalErrorCategory.DatabaseError);
        record.SqlErrorNumber.Should().Be(-2);
    }
}
