namespace ArchLucid.Cli.Diagnostics;

/// <summary>One printable row for <c>archlucid doctor</c> quick-start readiness.</summary>
internal readonly struct DoctorReadinessLine
{
    internal DoctorReadinessLine(bool ok, string label, string detail)
    {
        Ok = ok;
        Label = label;
        Detail = detail;
    }

    internal bool Ok { get; }

    internal string Label { get; }

    internal string Detail { get; }

    internal string Format()
    {
        string mark = Ok ? "\u2713" : "\u2717";

        return $"{mark} {Label,-22} — {Detail}";
    }
}
