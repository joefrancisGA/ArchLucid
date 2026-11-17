import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARTIFACT_CREATED_DATE_WAS_NOT_STORED } from "@/lib/artifacts/format-artifact-created-utc-display";

import { SealedRecordArtifactGeneratedTimestamp } from "./sealed-record-artifact-generated-timestamp";

describe("SealedRecordArtifactGeneratedTimestamp (P-20)", () => {
  it("labels omitted artifact generated time", () => {
    render(<SealedRecordArtifactGeneratedTimestamp createdUtc={null} />);

    expect(screen.getByTestId("sealed-record-artifact-generated-timestamp")).toHaveTextContent(
      ARTIFACT_CREATED_DATE_WAS_NOT_STORED,
    );
  });
});
