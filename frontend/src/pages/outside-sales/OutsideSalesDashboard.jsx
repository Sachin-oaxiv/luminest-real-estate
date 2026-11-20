
import { useNavigate } from "react-router-dom";
import "../../styles/pages/outside-sales-dashboard.css";

export default function OutsideSalesDashboard() {
  const navigate = useNavigate();

  return (
    <main className="lm-outside-dashboard">
      <header className="lm-outside-dashboard-header">
        <div>
          <span>LUMINEST · EMPLOYEE WORKSPACE</span>
          <h1>Outside Sales Dashboard</h1>
          <p>
            Manage your assigned property visits, customer meetings
            and field activities.
          </p>
        </div>

        <div className="lm-outside-dashboard-mark">OS</div>
      </header>

      <section className="lm-outside-dashboard-welcome">
        <div>
          <span>YOUR FIELD WORKSPACE</span>
          <h2>Make every property visit count.</h2>
          <p>
            View your assigned visits, meet customers and keep
            your field activities updated.
          </p>

          <button
            type="button"
            onClick={() => navigate("/outside-sales/visits")}
          >
            View My Assigned Visits →
          </button>
        </div>

        <div className="lm-outside-dashboard-welcome-mark">L</div>
      </section>

      <section className="lm-outside-dashboard-section">
        <div className="lm-outside-dashboard-heading">
          <h2>My Workspace</h2>
          <p>Your property visit tools.</p>
        </div>

        <div className="lm-outside-dashboard-shortcuts">

          {/* MY ASSIGNED VISITS */}
          <button
            type="button"
            className="lm-outside-dashboard-shortcut"
            onClick={() => navigate("/outside-sales/visits")}
          >
            <div className="lm-outside-shortcut-top">
              <div className="lm-outside-shortcut-icon">
                <span>▤</span>
              </div>
              <span className="lm-outside-shortcut-number">01</span>
            </div>

            <div className="lm-outside-shortcut-content">
              <h3>My Assigned Visits</h3>
              <p>
                View customers and properties assigned to you.
              </p>
            </div>

            <div className="lm-outside-shortcut-footer">
              <span>VISIT MANAGEMENT</span>
              <span className="lm-outside-shortcut-arrow">→</span>
            </div>
          </button>

          {/* VISIT EVIDENCE */}
          <button
            type="button"
            className="lm-outside-dashboard-shortcut"
            onClick={() => navigate("/outside-sales/evidence")}
          >
            <div className="lm-outside-shortcut-top">
              <div className="lm-outside-shortcut-icon">
                <span>▧</span>
              </div>
              <span className="lm-outside-shortcut-number">02</span>
            </div>

            <div className="lm-outside-shortcut-content">
              <h3>Visit Evidence</h3>
              <p>
                Manage property visit photos and supporting evidence.
              </p>
            </div>

            <div className="lm-outside-shortcut-footer">
              <span>FIELD DOCUMENTATION</span>
              <span className="lm-outside-shortcut-arrow">→</span>
            </div>
          </button>

        </div>
      </section>
    </main>
  );
}
