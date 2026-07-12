"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "../../AuthLayout";

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } }; message?: string };
  return error.response?.data?.message || error.message || fallback;
}

export default function GitHubCallbackClient(): ReactElement {
  const { completeGithubLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const search = searchParams.toString();

    completeGithubLogin(`?${search}`)
      .then(() => {
        if (!cancelled) router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "GitHub sign-in failed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completeGithubLogin, searchParams, router]);

  return (
    <AuthLayout title="Signing you in" sub="Completing GitHub authentication">
      {error ? (
        <>
          <div className="auth-error">{error}</div>
          <button
            type="button"
            className="btn-primary auth-submit"
            onClick={() => router.replace("/auth/login")}
          >
            Back to sign in
          </button>
        </>
      ) : (
        <div className="auth-loading-panel" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>Connecting GitHub...</span>
        </div>
      )}
    </AuthLayout>
  );
}
