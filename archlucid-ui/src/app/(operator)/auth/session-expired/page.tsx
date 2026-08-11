import type { Metadata } from "next";

import { SessionExpiredClient } from "@/app/(operator)/auth/session-expired/SessionExpiredClient";
import {
  SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
  SESSION_EXPIRED_PAGE_METADATA_TITLE,
} from "@/lib/auth/session-expired-page-copy";

export const metadata: Metadata = {
  title: SESSION_EXPIRED_PAGE_METADATA_TITLE,
  description: SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
};

export default function SessionExpiredPage() {
  return <SessionExpiredClient />;
}
