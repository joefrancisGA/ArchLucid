import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";



import { RunDetailPipelineStagesSection } from "./RunDetailPipelineStagesSection";



describe("RunDetailPipelineStagesSection", () => {

  it("renders one row per stage with danger tag for failed outcome", () => {

    render(

      <RunDetailPipelineStagesSection

        stageTimeline={[

          {

            stageName: "context_ingestion",

            startedUtc: "2026-06-01T12:00:00Z",

            completedUtc: "2026-06-01T12:00:01Z",

            outcomeStatus: "succeeded",

            durationMs: 1000,

          },

          {

            stageName: "findings",

            startedUtc: "2026-06-01T12:00:05Z",

            completedUtc: "2026-06-01T12:00:10Z",

            outcomeStatus: "failed",

            durationMs: 5000,

          },

        ]}

        otelTraceId={null}

      />,

    );



    expect(screen.getByTestId("run-detail-pipeline-stages-list").children).toHaveLength(2);

    expect(screen.getByTestId("pipeline-stage-row-findings")).toBeInTheDocument();

    expect(screen.getByText("Failed")).toBeInTheDocument();

    expect(screen.getAllByTestId("pipeline-stage-duration")[0]).not.toBeVisible();

    expect(screen.getByText("Technical details")).toBeInTheDocument();

  });



  it("hides section when timeline is empty", () => {

    const { container } = render(

      <RunDetailPipelineStagesSection stageTimeline={[]} otelTraceId={null} />,

    );



    expect(container.firstChild).toBeNull();

  });

});


