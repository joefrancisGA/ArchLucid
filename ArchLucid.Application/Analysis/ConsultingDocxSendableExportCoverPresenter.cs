using ArchLucid.Application.Exports;

namespace ArchLucid.Application.Analysis;

internal static class ConsultingDocxSendableExportCoverPresenter
{
    public static IReadOnlyList<string> RenderPlainTextLines(CareerExportCoverageHonestyInput input) =>
        SendableExportCoverComposer.RenderPlainTextLines(input);
}
