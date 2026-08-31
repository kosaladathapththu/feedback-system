import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  MapPin,
  Star,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Brand from "../components/Brand";
import LoadingState from "../components/LoadingState";
import { submitFeedback } from "../services/feedbackService";
import { getLocationByCode } from "../services/locationService";
import {
  categoriesByZone,
  makeReference,
  validateDetails,
} from "../utils/feedback";

const initial = {
  rating: 0,
  categories: [],
  comment: "",
  otherDetail: "",
  customerName: "",
  email: "",
  phone: "",
  urgent: false,
};
const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
export default function FeedbackPage() {
  const { code = "" } = useParams();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await getLocationByCode(code);
        if (live) setLocation(data);
      } catch (e) {
        if (live) setError(e.message);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [code]);
  const patch = (update) => setForm((current) => ({ ...current, ...update }));
  const next = () => {
    if (step === 1 && !form.rating)
      return setErrors({ rating: "Choose a rating to continue." });
    if (step === 2 && !form.categories.length)
      return setErrors({ categories: "Choose at least one category." });
    if (
      step === 2 &&
      form.categories.includes("Other") &&
      !form.otherDetail.trim()
    )
      return setErrors({
        categories: "Please tell us more about your other feedback.",
      });
    const found = step === 3 ? validateDetails(form) : {};
    setErrors(found);
    if (!Object.keys(found).length) setStep((s) => s + 1);
  };
  const send = async () => {
    const ref = makeReference();
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(location, form, ref);
      setReference(ref);
      setStep(5);
    } catch (e) {
      setError(
        e.message || "We could not submit your feedback. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading)
    return (
      <main className="guest-page">
        <LoadingState />
      </main>
    );
  if (error && !location)
    return (
      <main className="guest-page">
        <section className="form-card state">
          <AlertCircle />
          <h1>Location unavailable</h1>
          <p>{error}</p>
          <small>Check the QR code or ask a team member for help.</small>
        </section>
      </main>
    );
  if (!location)
    return (
      <main className="guest-page">
        <section className="form-card state">
          <MapPin />
          <h1>Location not found</h1>
          <p>This QR code is inactive or invalid.</p>
        </section>
      </main>
    );
  const cats = categoriesByZone[location.zone] || categoriesByZone.apartment;
  return (
    <main className="guest-page">
      <header className="guest-header">
        <Brand />
        <span>Guest feedback</span>
      </header>
      <section className="form-card">
        {step < 5 && (
          <>
            <div className="guest-spotlight">
              <div>
                <p className="eyebrow">You are reviewing</p>
                <h2>{location.name}</h2>
              </div>
              <span><MapPin size={13} /> {location.code}</span>
            </div>
            <div className="progress" aria-label={`Step ${step} of 4`}>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={n <= step ? "active" : ""} />
              ))}
            </div>
            <div className="step-count">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% complete</span>
            </div>
          </>
        )}
        {step === 1 && (
          <div className="step premium-step">
            <p className="eyebrow">A quick check-in</p>
            <h1>How was your experience?</h1>
            <p>
              Your honest feedback helps us make every stay and visit truly
              exceptional.
            </p>
            <div className="rating-panel" aria-label="Rating">
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    aria-label={`${n} stars - ${ratingLabels[n]}`}
                    key={n}
                    onClick={() => {
                      patch({ rating: n });
                      setErrors({});
                    }}
                  >
                    <Star className={n <= form.rating ? "filled" : ""} />
                  </button>
                ))}
              </div>
              <p className={`rating-label ${form.rating ? "chosen" : ""}`}>
                {form.rating ? ratingLabels[form.rating] : "Select a rating"}
              </p>
            </div>
            {errors.rating && <p className="field-error">{errors.rating}</p>}
          </div>
        )}
        {step === 2 && (
          <div className="step premium-step">
            <p className="eyebrow">Tell us more</p>
            <h1>What stood out?</h1>
            <p>Select everything that applies.</p>
            <div className="chips">
              {cats.map((cat) => {
                const on = form.categories.includes(cat);
                return (
                  <button
                    className={on ? "selected" : ""}
                    key={cat}
                    onClick={() =>
                      patch({
                        categories: on
                          ? form.categories.filter((x) => x !== cat)
                          : [...form.categories, cat],
                        otherDetail:
                          cat === "Other" && !on ? form.otherDetail : form.otherDetail,
                      })
                    }
                  >
                    {on && <Check size={16} />} {cat}
                  </button>
                );
              })}
            </div>
            {form.categories.includes("Other") && (
              <label>
                Please tell us more <span>optional but helpful</span>
                <textarea
                  value={form.otherDetail}
                  onChange={(e) => patch({ otherDetail: e.target.value })}
                  placeholder="Tell us what you mean by other feedback…"
                />
              </label>
            )}
            {errors.categories && (
              <p className="field-error">{errors.categories}</p>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="step premium-step">
            <p className="eyebrow">The details</p>
            <h1>Anything else to share?</h1>
            <label>
              Comment <span>optional</span>
              <textarea
                value={form.comment}
                maxLength="1000"
                onChange={(e) => patch({ comment: e.target.value })}
                placeholder="Tell us what happened…"
              />
              <small className="char-count">{form.comment.length}/1000</small>
            </label>
            <div className="field-row">
              <label>
                Name <span>optional</span>
                <input
                  value={form.customerName}
                  onChange={(e) => patch({ customerName: e.target.value })}
                  placeholder="Your name"
                />
                {errors.customerName && (
                  <small className="field-error">{errors.customerName}</small>
                )}
              </label>
              <label>
                Email <span>optional</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <small className="field-error">{errors.email}</small>
                )}
              </label>
            </div>
            <label>
              Phone <span>optional</span>
              <input
                inputMode="tel"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="Contact number"
              />
              {errors.phone && (
                <small className="field-error">{errors.phone}</small>
              )}
            </label>
            <label className="urgent">
              <span>
                <strong>Needs urgent attention</strong>
                <small>Alert our management team promptly</small>
              </span>
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={(e) => patch({ urgent: e.target.checked })}
              />
            </label>
          </div>
        )}
        {step === 4 && (
          <div className="step premium-step">
            <p className="eyebrow">One last look</p>
            <h1>Ready to send?</h1>
            <div className="review review-premium">
              <span>
                Location <b>{location.name}</b>
              </span>
              <span>
                Rating <b>{"★".repeat(form.rating)}</b>
              </span>
              <span>
                Categories <b>{form.categories.join(", ") || "General"}</b>
              </span>
              {form.otherDetail && (
                <span>
                  Other details <b>{form.otherDetail}</b>
                </span>
              )}
              {form.comment && (
                <span>
                  Comment <b>{form.comment}</b>
                </span>
              )}
            </div>
            {error && <p className="field-error">{error}</p>}
          </div>
        )}
        {step === 5 && (
          <div className="thanks">
            <span className="success">
              <Check />
            </span>
            <p className="eyebrow">Feedback received</p>
            <h1>Thank you.</h1>
            <p>Your feedback has been shared with our team.</p>
            <div className="reference">
              <small>Reference number</small>
              <strong>{reference}</strong>
            </div>
            <div className="review">
              <span>
                Location <b>{location.name}</b>
              </span>
              <span>
                Rating <b>{"★".repeat(form.rating)}</b>
              </span>
              <span>
                Categories <b>{form.categories.join(", ") || "General"}</b>
              </span>
              {form.otherDetail && (
                <span>
                  Other details <b>{form.otherDetail}</b>
                </span>
              )}
            </div>
            <button
              className="primary thanks-home"
              onClick={() => {
                setForm(initial);
                setStep(1);
                setReference("");
                navigate(`/f/${location.code}`);
              }}
            >
              <Home size={17} /> Home
            </button>
            <button
              className="secondary thanks-track"
              type="button"
              onClick={() => navigate(`/track/${reference}`)}
            >
              Track feedback status
            </button>
          </div>
        )}
        {step < 5 && (
          <footer>
            {step > 1 ? (
              <button className="back" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={17} /> Back
              </button>
            ) : (
              <span />
            )}
            <button
              className="primary"
              disabled={submitting}
              onClick={step === 4 ? send : next}
            >
              {submitting
                ? "Sending…"
                : step === 4
                  ? "Submit feedback"
                  : "Continue"}{" "}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </footer>
        )}
      </section>
      <p className="privacy">Your feedback is private and securely handled.</p>
    </main>
  );
}
