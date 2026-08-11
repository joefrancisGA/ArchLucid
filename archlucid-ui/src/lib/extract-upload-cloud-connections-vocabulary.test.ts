import { describe, expect, it } from "vitest";

import { EXTRACT_UPLOAD_SETTINGS_PATH } from "@/lib/core-pilot-steps";
import {
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO,
  buildExtractUploadCloudConnectionsVocabulary,
  resolveExtractUploadCloudConnectionsPeerLink,
} from "@/lib/extract-upload-cloud-connections-vocabulary";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

describe("extract-upload-cloud-connections-vocabulary (TB-2281)", () => {
  it("explains extract-upload ZIP path vs cloud inventory connections", () => {
    const model = buildExtractUploadCloudConnectionsVocabulary();

    expect(model.heading).toBe(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING);
    expect(model.heading.toLowerCase()).toContain("extract");
    expect(model.heading.toLowerCase()).toContain("cloud connections");
    expect(model.whyTwo).toBe(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("zip");
    expect(model.whyTwo.toLowerCase()).toContain("inventory");
    expect(model.compactLine).toBe(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE);

    expect(model.extractUploadLink).toEqual(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK);
    expect(model.extractUploadLink.href).toBe(EXTRACT_UPLOAD_SETTINGS_PATH);
    expect(model.extractUploadLink.href).toBe("/administration/extract-upload");

    expect(model.cloudConnectionsLink).toEqual(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK);
    expect(model.cloudConnectionsLink.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(model.cloudConnectionsLink.href).toBe("/integrations/cloud-connections");
  });

  it("resolves the peer surface from extract-upload and cloud connections", () => {
    expect(resolveExtractUploadCloudConnectionsPeerLink("extract-upload")).toEqual(
      EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK,
    );

    expect(resolveExtractUploadCloudConnectionsPeerLink("cloud-connections")).toEqual(
      EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK,
    );
  });
});
