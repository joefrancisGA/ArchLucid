import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND,
  EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND,
  extractUploadValidateCliCommand,
} from "@/lib/extract-upload-settings-page-copy";

describe("extractUploadValidateCliCommand", () => {
  it("returns the ArchLucid CLI command for each platform", () => {
    expect(extractUploadValidateCliCommand("azure", "architecture")).toBe(EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND);
    expect(extractUploadValidateCliCommand("aws", "architecture")).toBe(EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND);
    expect(extractUploadValidateCliCommand("gcp", "architecture")).toBe(EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND);
  });

  it("uses the securenow executable name for SecureNow", () => {
    expect(extractUploadValidateCliCommand("azure", "security")).toBe(
      "securenow azure validate-zip --path <your-package.zip>",
    );
    expect(extractUploadValidateCliCommand("aws", "security")).toBe(
      "securenow aws validate-zip --path <your-package.zip>",
    );
    expect(extractUploadValidateCliCommand("gcp", "security")).toBe(
      "securenow gcp validate-zip --path <your-package.zip>",
    );
  });
});
