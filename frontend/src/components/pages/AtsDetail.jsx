import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../../style/ats.scss";
import AppLayout from "../layout/AppLayout";
import PageHeader from "../layout/PageHeader";
import AtsResult from "../ats/AtsResult";
import { useAts } from "../../features/ats/hooks/useAts";

const AtsDetail = () => {
  const { id } = useParams();
  const { loading, analysis, error, fetchById } = useAts();

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetchById(id, { signal: controller.signal }).catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AppLayout>
      <div className="ats-page">
        <div className="ats-container">
          <PageHeader
            glyph="◉"
            title="ATS Report"
            subtitle="Score breakdown and AI feedback for this analysis."
          >
            <Link to="/ats/history" className="pg-btn pg-btn--ghost">
              ← Back to history
            </Link>
            <Link to="/ats" className="pg-btn pg-btn--primary">
              <span aria-hidden="true">✦</span> New analysis
            </Link>
          </PageHeader>

          {loading && (
            <section className="ats-card ats-loading-card">
              <span className="spinner spinner-lg" />
              <p>Loading analysis…</p>
            </section>
          )}

          {error && <p className="ats-error">{error}</p>}

          {!loading && !error && analysis && <AtsResult analysis={analysis} />}

          {!loading && !error && !analysis && (
            <section className="ats-card">
              <p className="muted">Analysis not found.</p>
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AtsDetail;
