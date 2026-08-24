export default function LoadingState({ label = "Preparing your experience…" }) {
  return (
    <div className="state">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}
