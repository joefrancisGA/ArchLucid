import { redirect } from "next/navigation";

/** Tenant-level architecture graph entry (redirects to interactive React Flow viewer). */
export default function ArchitectureGraphOperatePage() {
  redirect("/graph");
}
