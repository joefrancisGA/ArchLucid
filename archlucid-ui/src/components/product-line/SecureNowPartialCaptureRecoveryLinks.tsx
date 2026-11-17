"use client";

import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildSecureNowSecondCaptureCloudConnectionsHref,
  buildSecureNowSecondCaptureExtractUploadHref,
} from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";
import { formatPartialCaptureWithSnapshotIdLine } from "@/lib/product-line/partial-capture-snapshot-id-honesty-copy";
import {
  SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL,
  SECURENOW_SECOND_CAPTURE_EXTRACT_UPLOAD_LABEL,
} from "@/lib/product-line/securenow-second-capture-cta-copy";
import { cn } from "@/lib/utils";

export type SecureNowPartialCaptureRecoveryLinksProps = {
  readonly partialCaptureSnapshotId: string | null;
  readonly returnPath: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
  readonly middleLine?: string;
};

/** Shared snapshot id + cloud connections and extract-upload links with securenowReturnPath. */
export function SecureNowPartialCaptureRecoveryLinks(
  props: SecureNowPartialCaptureRecoveryLinksProps,
): React.JSX.Element {
  return (
    <>
      {formatPartialCaptureWithSnapshotIdLine(props.partialCaptureSnapshotId)}
      {props.middleLine !== undefined && props.middleLine.length > 0 ? (
        <>
          {" "}
          {props.middleLine}{" "}
        </>
      ) : null}
      <Link
        className={OPERATOR_LINK.inline}
        href={buildSecureNowSecondCaptureCloudConnectionsHref(props.returnPath)}
        data-testid={props.cloudConnectionsTestId}
      >
        {SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL}
      </Link>
      {" · "}
      <Link
        className={OPERATOR_LINK.inline}
        href={buildSecureNowSecondCaptureExtractUploadHref(props.returnPath)}
        data-testid={props.extractUploadTestId}
      >
        {SECURENOW_SECOND_CAPTURE_EXTRACT_UPLOAD_LABEL}
      </Link>
    </>
  );
};

export type SecureNowPartialCaptureRecoveryParagraphProps = SecureNowPartialCaptureRecoveryLinksProps & {
  readonly testId: string;
  readonly className?: string;
};

export function SecureNowPartialCaptureRecoveryParagraph(
  props: SecureNowPartialCaptureRecoveryParagraphProps,
): React.JSX.Element {
  const { testId, className, ...linksProps } = props;

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, className)} data-testid={testId}>
      <SecureNowPartialCaptureRecoveryLinks {...linksProps} />
    </p>
  );
};