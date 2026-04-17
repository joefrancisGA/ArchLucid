import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/marketing/SignupForm";

export const metadata: Metadata = {
  title: "Start free trial",
  description: "Create a self-service ArchLucid trial workspace.",
};

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Start your trial</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
        Tell us who you are and which organization you represent. We will create a dedicated workspace and seed a
        sample architecture run you can explore before you run your own pipeline. Already have an account?{" "}
        <Link href="/auth/signin" className="text-teal-800 underline dark:text-teal-300">
          Sign in
        </Link>
        .
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </main>
  );
}
