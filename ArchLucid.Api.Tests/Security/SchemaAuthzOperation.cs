namespace ArchLucid.Api.Tests.Security;

/// <summary>
/// One OpenAPI operation classified for ABQ-28 schema-derived authz fuzzing.
/// </summary>
public sealed record SchemaAuthzOperation(
    string Method,
    string Path,
    bool InAuthzMatrix,
    bool IsPublic);
