namespace ArchLucid.ReviewApiHarness;

/// <summary>Result of one validation pass over a response body.</summary>
public sealed record ResponseValidationResult(bool Passed, IReadOnlyList<string> Errors)
{
    public static ResponseValidationResult Ok() => new(true, []);

    public static ResponseValidationResult Fail(params string[] errors) => new(false, errors);

    public static ResponseValidationResult Combine(params ResponseValidationResult[] parts)
    {
        List<string> errors = [];

        foreach (ResponseValidationResult part in parts)
        {
            if (!part.Passed)
                errors.AddRange(part.Errors);
        }

        return new ResponseValidationResult(errors.Count == 0, errors);
    }
}
