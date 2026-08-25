import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { isFirebaseConfigured } from "./firebase/config";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import LoginPage from "./pages/LoginPage";
import TrackFeedbackPage from "./pages/TrackFeedbackPage";
export default function App() {
  return (
    <Routes>
      <Route path="/f/:code" element={<FeedbackPage />} />
      <Route path="/track" element={<TrackFeedbackPage />} />
      <Route path="/track/:reference" element={<TrackFeedbackPage />} />
      <Route
        path="/login"
        element={
          isFirebaseConfigured ? (
            <LoginPage />
          ) : (
            <Navigate to="/manage" replace />
          )
        }
      />
      <Route
        path="/manage/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/manage" replace />} />
    </Routes>
  );
}
