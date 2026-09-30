import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../../style/ats.scss";
import Navbar from "../Navbar";
import AtsResult from "../ats/AtsResult";
import { useAts } from "../../features/ats/hooks/useAts";

const AtsDetail = () => {
  const { id } = useParams();
  const { loading, analysis, error, fetchById } = useAts();

  useEffect(() => {
    if (id) fetchById(id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="ats-page">
      <Navbar />

      <div className="ats-container">
        <header className="ats-header ats-header-row">
          <div>
            <h1>
              Analysis <span className="gradient-text">Detail</span>
            </h1>
            <Link to="/ats/history" className="ats-link">
              ← Back to history
            </Link>
          </div>
          <Link to="/ats" className="button primary-button">
            <span className="btn-sparkle">✦</span> New analysis
          </Link>
        </header>

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
    </main>
  );
};

export default AtsDetail;
