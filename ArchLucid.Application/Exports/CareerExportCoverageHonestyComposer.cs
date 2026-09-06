using System.Text;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Shared honesty block for sponsor PDF, consulting DOCX, and sponsor packet exports — mirrors
///     <c>career-export-coverage-honesty.ts</c> (PC-01 / PC-13).
/// </summary>
public static class CareerExportCoverageHonestyComposer
{
    public static CareerExportCoverageHonesty Resolve(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(input.CoverageContext);

        InsightDensityMeasurementFloorPresentation measurementFloor =
            InsightDensityMeasurementFloorPresenter.Present(input.EnginesSucceeded);
        string? measurementFloorBlockedReason =
            InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(
                input.EnginesSucceeded,
                input.CatalogAdvisoryEngineFailureCount);
        string? workingCareerExportBlockedReason = ResolveWorkingCareerExportBlockedReason(
            input,
            measurementFloorBlockedReason);

        StringBuilder sponsorMarkdownBuilder = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sponsorMarkdownBuilder, input.CoverageContext);
        string sponsorHonestyMarkdown = sponsorMarkdownBuilder.ToString().Trim();

        bool blockedForWorkingCareerExport = input.WorkingDesk && workingCareerExportBlockedReason is not null;

        return new CareerExportCoverageHonesty(
            measurementFloor,
            workingCareerExportBlockedReason ?? measurementFloorBlockedReason,
            sponsorHonestyMarkdown,
            blockedForWorkingCareerExport);
    }

    private static string? ResolveWorkingCareerExportBlockedReason(
        CareerExportCoverageHonestyInput input,
        string? measurementFloorBlockedReason)
    {
        if (!input.WorkingDesk)
        {
            return null;
        }

        string? gateBlockedReason =
            PreCommitGovernanceGateCareerHonestyPresenter.FormatCareerExportBlockedReason(input.PreCommitGateEnabled);

        if (gateBlockedReason is not null)
        {
            return gateBlockedReason;
        }

        return measurementFloorBlockedReason;
    }

    public static string FormatMarkdown(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        CareerExportCoverageHonesty honesty = Resolve(input);
        List<string> sections = [FormatMeasurementFloorMarkdown(input.EnginesSucceeded).Trim()];

        string classificationMarkdown = FormatClassificationBandMarkdown(input.ClassificationCounts).Trim();

        if (classificationMarkdown.Length > 0)
        {
            sections.Add(classificationMarkdown);
        }

        if (honesty.SponsorHonestyMarkdown.Length > 0)
        {
            sections.Add(honesty.SponsorHonestyMarkdown);
        }

        if (honesty.BlockedForWorkingCareerExport && honesty.MeasurementFloorBlockedReason is not null)
        {
            sections.Add($"> **Incomplete for career use:** {honesty.MeasurementFloorBlockedReason}");
        }

        return string.Join("\n\n", sections);
    }

    public static string FormatPlainText(CareerExportCoverageHonestyInput input)
    {
        string markdown = FormatMarkdown(input);

        return markdown
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split('\n')
            .Select(static line =>
            {
                string trimmed = line.TrimStart();

                if (trimmed.StartsWith("## ", StringComparison.Ordinal))
                {
                    return trimmed[3..].Trim();
                }

                if (trimmed.StartsWith("> ", StringComparison.Ordinal))
                {
                    return trimmed[2..].Replace("**", string.Empty, StringComparison.Ordinal).Trim();
                }

                return line.Replace("**", string.Empty, StringComparison.Ordinal);
            })
            .Aggregate(
                new StringBuilder(),
                static (builder, line) =>
                {
                    if (builder.Length > 0)
                    {
                        builder.Append('\n');
                    }

                    builder.Append(line);

                    return builder;
                },
                static builder => builder.ToString().Trim());
    }

    public static string? ResolveBlockedReason(CareerExportCoverageHonestyInput input)
    {
        CareerExportCoverageHonesty honesty = Resolve(input);

        if (!honesty.BlockedForWorkingCareerExport)
        {
            return null;
        }

        return honesty.MeasurementFloorBlockedReason;
    }

    public static void AppendMarkdownSection(StringBuilder sb, CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(input);

        string markdown = FormatMarkdown(input).Trim();

        if (markdown.Length == 0)
        {
            return;
        }

        sb.AppendLine(markdown);
        sb.AppendLine();
    }

    public static IReadOnlyList<string> RenderPlainTextLines(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        string plainText = FormatPlainText(input).Trim();

        if (plainText.Length == 0)
        {
            return [];
        }

        return plainText
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
    }

    public static string FormatMeasurementFloorMarkdown(int? enginesSucceeded)
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(enginesSucceeded);

        return $"## Measurement floor\n\n{presentation.Sentence}\n";
    }

    public static string FormatClassificationBandMarkdown(CareerExportClassificationCounts? counts)
    {
        string? bandLine = FormatClassificationBandLine(counts);

        if (bandLine is null)
        {
            return string.Empty;
        }

        return $"## Finding bands\n\n{bandLine}\n";
    }

    public static string? FormatClassificationBandLine(CareerExportClassificationCounts? counts)
    {
        if (counts is null)
        {
            return null;
        }

        int decisionGrade = Math.Max(0, counts.DecisionGrade);
        int checklist = Math.Max(0, counts.Checklist);
        int total = decisionGrade + checklist;

        if (total == 0)
        {
            return null;
        }

        return
            $"Decision-grade: {decisionGrade} · Checklist: {checklist} (ADR 0070 gate classification on this package snapshot).";
    }
}
