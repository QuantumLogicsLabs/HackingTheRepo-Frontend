import { useEffect, useState } from "react";
import api from "../utils/api";
import SuccessRateChart from "../components/Charts/SuccessRateChart";
import MostUsedReposChart from "../components/Charts/MostUsedReposChart";
import JobDurationTrendChart from "../components/Charts/JobDurationTrendChart";
import "./LandingPage.css";
import "./DashboardPage.css";
import "./AnalyticsPage.css";
import type { Job } from "../types";

function repoName(url: string): string {
  try {
    return url.split("github.com/")[1] || url;
  } catch {
    return url;
  }
}

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const MIN_SPINNER_MS = 1000; // ensure spinner visible for at least this duration

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const start = Date.now();
      try {
        const { data } = await api.get("/jobs");
        if (!mounted) return;
        setJobs(data as Job[]);
      } catch (err) {
        setJobs([]);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Insights into job performance and usage.</p>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="card analytics-card">
          <h3 className="section-title">Success Rate</h3>
          <SuccessRateChart jobs={jobs} loading={loading} />
        </section>

        <section className="card analytics-card">
          <h3 className="section-title">Most-used Repos</h3>
          <MostUsedReposChart
            jobs={jobs}
            loading={loading}
            repoName={repoName}
          />
        </section>

        <section className="card analytics-card">
          <h3 className="section-title">Job Duration Trends</h3>
          <JobDurationTrendChart jobs={jobs} loading={loading} />
        </section>
      </div>
    </div>
  );
}
