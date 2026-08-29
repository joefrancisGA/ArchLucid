using System.Text.Json;

using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Application.Tests.OperationalErrors;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
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

    [Fact]
    public void Build_preserves_requested_category_when_exception_is_not_sql()
    {
        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            Exception = new InvalidOperationException("boom"),
            HttpStatusCode = 500
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        record.Category.Should().Be(OperationalErrorCategory.HttpError);
        record.SqlErrorNumber.Should().BeNull();
        record.SqlErrorState.Should().BeNull();
    }

    [Fact]
    public void Build_uses_message_override_and_truncates_fields()
    {
        string longMessage = new('x', 25);
        OperationalErrorOptions options = new() { MaxMessageLength = 10 };

        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            MessageOverride = longMessage,
            HttpMethod = "GET",
            RequestPath = "/v1/runs",
            ProblemType = "problem",
            CorrelationId = "corr",
            OtelTraceId = "trace",
            ActorUserId = "actor"
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, options);

        record.Message.Should().Be(new string('x', 10));
        record.HttpMethod.Should().Be("GET");
        record.RequestPath.Should().Be("/v1/runs");
        record.ProblemType.Should().Be("problem");
        record.CorrelationId.Should().Be("corr");
        record.OtelTraceId.Should().Be("trace");
        record.ActorUserId.Should().Be("actor");
        record.ExceptionType.Should().BeNull();
        record.StackTrace.Should().BeNull();
    }

    [Fact]
    public void Build_defaults_message_when_no_exception_or_override()
    {
        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        record.Message.Should().Be("HTTP error");
    }

    [Fact]
    public void Build_serializes_detail_fields_and_inner_exception_summaries()
    {
        Exception inner = new InvalidOperationException("inner-msg");
        Exception outer = new Exception("outer-msg", inner);

        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            Exception = outer,
            DetailFields = new Dictionary<string, string> { ["key"] = "value" }
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        using JsonDocument document = JsonDocument.Parse(record.DetailJson);
        JsonElement root = document.RootElement;

        root.GetProperty("key").GetString().Should().Be("value");
        root.GetProperty("innerExceptions").GetString().Should().Contain("InvalidOperationException");
    }

    [Fact]
    public void Build_detects_sql_exception_on_inner_exception_chain()
    {
        Microsoft.Data.SqlClient.SqlException sqlException = SqlExceptionTestFactory.Create(547);
        Exception wrapped = new Exception("wrapper", sqlException);

        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            Exception = wrapped
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        record.Category.Should().Be(OperationalErrorCategory.DatabaseError);
        record.SqlErrorNumber.Should().Be(547);
    }

    [Fact]
    public void Build_truncates_stack_trace_to_configured_max_length()
    {
        string stackTrace = new('s', 30);
        OperationalErrorOptions options = new() { MaxStackTraceLength = 12 };

        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            Exception = new FixedStackTraceException(stackTrace)
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, options);

        record.StackTrace.Should().Be(new string('s', 12));
    }

    [Fact]
    public void Build_returns_null_truncated_fields_when_values_are_empty()
    {
        OperationalErrorCaptureRequest request = new()
        {
            Source = OperationalErrorSource.Api,
            Category = OperationalErrorCategory.HttpError,
            HttpMethod = string.Empty,
            RequestPath = string.Empty
        };

        OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, new OperationalErrorOptions());

        record.HttpMethod.Should().BeNull();
        record.RequestPath.Should().BeNull();
    }

    private sealed class FixedStackTraceException : Exception
    {
        public FixedStackTraceException(string stackTrace)
        {
            StackTraceOverride = stackTrace;
        }

        private string StackTraceOverride
        {
            get;
        }

        public override string? StackTrace => StackTraceOverride;
    }
}
