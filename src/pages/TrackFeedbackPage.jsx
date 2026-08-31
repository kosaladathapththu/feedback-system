import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Brand from "../components/Brand";
import { getFeedbackStatus } from "../services/feedbackService";

const statusCopy = {
  open: {
    title: "Received",
    detail: "Your feedback has reached the Supun Arcade team.",
    Icon: Send,
  },
  in_progress: {
    title: "In progress",
    detail: "Our team is reviewing this and working on the next steps.",
    Icon: Clock3,
  },
  resolved: {
    title: "Resolved",
    detail: "This feedback has been marked as resolved by our team.",
    Icon: CheckCircle2,
  },
};

const statusOrder = ["open", "in_progress", "resolved"];

const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString();
};

export default function TrackFeedbackPage() {
  const { reference: referenceParam = "" } = useParams();
  const navigate = useNavigate();
  const [reference, setReference] = useState(referenceParam);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initialLookupComplete = useRef(false);

  const lookUp = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setFeedback(null);
    try {
      const result = await getFeedbackStatus(reference);
      setFeedback(result);
      navigate(`/track/${result.feedbackId}`, { replace: true });
    } catch (issue) {
      setError(issue.message || "We could not retrieve that feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!referenceParam || initialLookupComplete.current) return;
    initialLookupComplete.current = true;
    setLoading(true);
    setError("");
    getFeedbackStatus(referenceParam)
      .then((result) => {
        setFeedback(result);
        setReference(result.feedbackId);
      })
      .catch((issue) => {
        setError(issue.message || "We could not retrieve that feedback.");
      })
      .finally(() => setLoading(false));
  }, [referenceParam]);

  const status = statusCopy[feedback?.status] || statusCopy.open;
  const StatusIcon = status.Icon;
  const currentStatusIndex = Math.max(
    0,
    statusOrder.indexOf(feedback?.status || "open"),
  );

  return (
    <main className="guest-page track-page">
      <header className="guest-header">
        <Brand />
        <span>Feedback status</span>
      </header>
      <section className="track-card">
        <button className="track-back" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <p className="eyebrow">Guest care</p>
        <h1>Track your feedback</h1>
        <p className="track-intro">
          Enter the reference number from your confirmation to see the latest update.
        </p>
        <form className="track-search" onSubmit={lookUp}>
          <input
            aria-label="Feedback reference number"
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase())}
            placeholder="FB-20260825-1234"
          />
          <button className="primary" disabled={loading}>
            <Search size={17} /> {loading ? "Checking..." : "Check status"}
          </button>
        </form>
        {error && <p className="track-error">{error}</p>}
        {feedback && (
          <div className={`status-result ${feedback.status || "open"}`}>
            <span className="status-result-icon"><StatusIcon /></span>
            <div>
              <p className="eyebrow">{status.title}</p>
              <h2>{status.detail}</h2>
            </div>
            <ol className="status-timeline" aria-label="Feedback progress">
              {statusOrder.map((item, index) => {
                const itemStatus = statusCopy[item];
                const StepIcon = itemStatus.Icon;
                return (
                  <li className={index <= currentStatusIndex ? "complete" : ""} key={item}>
                    <span><StepIcon /></span>
                    <strong>{itemStatus.title}</strong>
                  </li>
                );
              })}
            </ol>
            <dl>
              <div><dt>Reference</dt><dd>{feedback.feedbackId}</dd></div>
              <div><dt>Location</dt><dd><MapPin size={14} /> {feedback.locationName}</dd></div>
              <div><dt>Submitted</dt><dd>{formatDate(feedback.createdAt)}</dd></div>
              <div><dt>Categories</dt><dd>{feedback.categories?.join(", ") || "General"}</dd></div>
            </dl>
            {feedback.resolutionNote && (
              <p className="status-note"><strong>Team update</strong>{feedback.resolutionNote}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
