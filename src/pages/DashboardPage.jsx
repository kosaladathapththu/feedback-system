import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import {
  Bell,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageSquareText,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Brand from "../components/Brand";
import LoadingState from "../components/LoadingState";
import { auth, isFirebaseConfigured } from "../firebase/config";
import {
  createAutoReplyDraft,
  getFeedback,
  openAutoReplyDraft,
  updateFeedback,
} from "../services/feedbackService";
import {
  getLocations,
  getUsers,
  saveLocation,
  updateUser,
} from "../services/managementService";
import { allFeedbackCategories, getCategoryCounts } from "../utils/feedback";

const demoFeedback = [
  {
    id: "FB-20260824-0101",
    feedbackId: "FB-20260824-0101",
    locationName: "Rooftop Restaurant",
    locationId: "RST-01",
    rating: 5,
    categories: ["Food Taste", "Staff Service"],
    comment: "Wonderful dinner and attentive service.",
    status: "open",
    urgent: false,
    createdAt: { toDate: () => new Date() },
  },
  {
    id: "FB-20260824-0102",
    feedbackId: "FB-20260824-0102",
    locationName: "Apartment 12",
    locationId: "APT-12",
    rating: 2,
    categories: ["Maintenance"],
    comment: "The air conditioner needs attention.",
    status: "in_progress",
    urgent: true,
    createdAt: { toDate: () => new Date(Date.now() - 86400000) },
  },
];
const zoneLabels = {
  apartment: "Apartment",
  restaurant: "Restaurant",
  pool: "Pool",
  headOffice: "Head Office",
  lobbyArea: "Lobby Area",
  washroom: "Washroom",
};
const demoLocations = [
  {
    id: "1",
    code: "APT-12",
    name: "Apartment 12",
    zone: "apartment",
    floor: "1",
    active: true,
  },
  {
    id: "2",
    code: "RST-01",
    name: "Rooftop Restaurant",
    zone: "restaurant",
    floor: "Roof",
    active: true,
  },
  {
    id: "3",
    code: "POOL-01",
    name: "Swimming Pool",
    zone: "pool",
    floor: "Ground",
    active: true,
  },
  {
    id: "4",
    code: "HO-01",
    name: "Head Office",
    zone: "headOffice",
    floor: "Ground",
    active: true,
  },
  {
    id: "5",
    code: "LOB-01",
    name: "Lobby Area",
    zone: "lobbyArea",
    floor: "Lobby",
    active: true,
  },
  {
    id: "6",
    code: "WASH-01",
    name: "Washroom",
    zone: "washroom",
    floor: "Ground",
    active: true,
  },
];
const zones = [
  { value: "apartment", label: "Apartment" },
  { value: "restaurant", label: "Restaurant" },
  { value: "pool", label: "Pool" },
  { value: "headOffice", label: "Head Office" },
  { value: "lobbyArea", label: "Lobby Area" },
  { value: "washroom", label: "Washroom" },
];
const dateLabel = (v) =>
  v?.toDate
    ? v.toDate().toLocaleDateString()
    : v
      ? new Date(v).toLocaleDateString()
      : "Today";
function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        {children}
      </section>
    </div>
  );
}
function Metric({ label, value, detail, Icon, onClick }) {
  return (
    <button type="button" className="metric" onClick={onClick}>
      <Icon />
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </button>
  );
}
export default function DashboardPage() {
  const [tab, setTab] = useState("overview"),
    [feedback, setFeedback] = useState([]),
    [locations, setLocations] = useState([]),
    [users, setUsers] = useState([]),
    [loading, setLoading] = useState(isFirebaseConfigured),
    [selected, setSelected] = useState(null),
    [locationForm, setLocationForm] = useState(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [categoryFilter, setCategoryFilter] = useState("all"),
    [notice, setNotice] = useState(""),
    [showNotifications, setShowNotifications] = useState(false),
    [seenFeedback, setSeenFeedback] = useState(
      () =>
        new Set(
          JSON.parse(localStorage.getItem("supun-seen-feedback") || "[]"),
        ),
    );
  const categorySummary = useMemo(() => getCategoryCounts(feedback), [feedback]);
  const topCategories = categorySummary.slice(0, 5);
  const maxCategoryCount = topCategories[0]?.count || 1;
  const load = async () => {
    if (!isFirebaseConfigured) {
      const saved = JSON.parse(
        localStorage.getItem("supun-preview-feedback") || "[]",
      ).map((item, index) => ({
        id: item.feedbackId || `preview-${index}`,
        ...item,
      }));
      setFeedback([...saved, ...demoFeedback]);
      setLocations(demoLocations);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [f, l, u] = await Promise.all([
        getFeedback(),
        getLocations(),
        getUsers(),
      ]);
      setFeedback(f);
      setLocations(l);
      setUsers(u);
    } catch (e) {
      setNotice(e.message || "Could not load management data.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(
    () =>
      feedback.filter(
        (f) =>
          (status === "all" || f.status === status) &&
          (categoryFilter === "all" ||
            (f.categories || []).includes(categoryFilter)) &&
          `${f.feedbackId} ${f.locationName} ${f.comment} ${f.categories?.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [feedback, status, categoryFilter, search],
  );
  const avg = feedback.length
      ? (feedback.reduce((n, f) => n + f.rating, 0) / feedback.length).toFixed(
          1,
        )
      : "—",
    open = feedback.filter((f) => f.status !== "resolved").length,
    urgent = feedback.filter((f) => f.urgent && f.status !== "resolved").length,
    unseen = feedback
      .filter((f) => !seenFeedback.has(f.feedbackId))
      .slice(0, 8);
  const markAllViewed = () => {
    const ids = feedback.map((f) => f.feedbackId);
    localStorage.setItem("supun-seen-feedback", JSON.stringify(ids));
    setSeenFeedback(new Set(ids));
  };
  const saveCase = async (changes) => {
    try {
      if (isFirebaseConfigured) await updateFeedback(selected.id, changes);
      setFeedback((all) =>
        all.map((f) => (f.id === selected.id ? { ...f, ...changes } : f)),
      );
      const nextStatus = changes.status || selected.status;
      const reply = createAutoReplyDraft({
        feedback: { ...selected, ...changes },
        status: nextStatus,
        comment: changes.resolutionNote || selected.resolutionNote,
      });
      if (typeof window !== "undefined") {
        window.location.href = `mailto:${reply.to}?subject=${encodeURIComponent(reply.subject)}&body=${encodeURIComponent(reply.body)}`;
      }
      setSelected(null);
      setNotice("Feedback record updated and auto-reply draft opened.");
    } catch (e) {
      setNotice(e.message);
    }
  };
  const saveLoc = async (e) => {
    e.preventDefault();
    try {
      if (isFirebaseConfigured) await saveLocation(locationForm);
      setLocations((all) =>
        locationForm.id
          ? all.map((l) => (l.id === locationForm.id ? locationForm : l))
          : [...all, { ...locationForm, id: crypto.randomUUID() }],
      );
      setLocationForm(null);
      setNotice("Location saved.");
    } catch (e2) {
      setNotice(e2.message);
    }
  };
  if (loading)
    return (
      <main className="dashboard">
        <LoadingState label="Loading management data…" />
      </main>
    );
  const nav = [
    ["overview", "Overview", LayoutDashboard],
    ["feedback", "Feedback", MessageSquareText],
    ["analytics", "Analytics", ChartNoAxesCombined],
    ["categories", "Top feedback category", ChartNoAxesCombined],
    ["locations", "Locations", MapPinned],
    ["team", "Team", Users],
  ];
  return (
    <main className="dashboard">
      <aside>
        <Brand light />
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        {isFirebaseConfigured && (
          <button onClick={() => auth && signOut(auth)}>
            <LogOut />
            Sign out
          </button>
        )}
      </aside>
      <section className="dash-main">
        {!isFirebaseConfigured && (
          <div className="preview-banner">
            Preview mode · Add Firebase configuration to use live data and
            changes.
          </div>
        )}
        <header>
          <div>
            <p className="eyebrow">Management portal</p>
            <h1>
              {tab === "overview"
                ? "Guest experience overview"
                : tab[0].toUpperCase() + tab.slice(1)}
            </h1>
          </div>
          <div className="notification-wrap">
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((show) => !show)}
            >
              <Bell />
              {unseen.length > 0 && (
                <span className="notification-count">
                  {unseen.length > 9 ? "9+" : unseen.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <section className="notification-panel">
                <div>
                  <strong>New feedback</strong>
                  {unseen.length > 0 && (
                    <button className="text-button" onClick={markAllViewed}>
                      Mark all viewed
                    </button>
                  )}
                </div>
                {unseen.length ? (
                  <ul>
                    {unseen.map((item) => (
                      <li key={item.feedbackId}>
                        <button
                          onClick={() => {
                            setSelected(item);
                            setShowNotifications(false);
                          }}
                        >
                          <span className="notification-star">
                            <Star fill="currentColor" /> {item.rating}
                          </span>
                          <span>
                            <b>{item.locationName}</b>
                            <small>
                              {item.categories?.join(", ") || "New feedback"} ·{" "}
                              {dateLabel(item.createdAt)}
                            </small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>You're all caught up.</p>
                )}
              </section>
            )}
          </div>
        </header>
        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="metrics">
              <Metric
                label="Total feedback"
                value={feedback.length}
                detail="All recorded responses"
                Icon={ClipboardList}
                onClick={() => {
                  setStatus("all");
                  setTab("feedback");
                }}
              />
              <Metric
                label="Average rating"
                value={avg}
                detail="Out of five stars"
                Icon={Star}
                onClick={() => setTab("analytics")}
              />
              <Metric
                label="Open cases"
                value={open}
                detail="Need follow-up"
                Icon={MessageSquareText}
                onClick={() => {
                  setStatus("open");
                  setTab("feedback");
                }}
              />
              <Metric
                label="Urgent attention"
                value={urgent}
                detail="Prioritize these today"
                Icon={Bell}
                onClick={() => {
                  setStatus("open");
                  setTab("feedback");
                }}
              />
            </div>
            <section className="panel">
              <h2>All feedback categories</h2>
              <div className="category-list">
                {allFeedbackCategories.slice(0, 5).map((category) => {
                  const count =
                    categorySummary.find((item) => item.name === category)?.count || 0;
                  return (
                    <button
                      key={category}
                      type="button"
                      className="category-row"
                      onClick={() => {
                        setCategoryFilter(category);
                        setStatus("all");
                        setTab("feedback");
                      }}
                    >
                      <div className="category-row-head">
                        <span>{category}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="category-track">
                        <span
                          style={{
                            width: `${Math.max((count / Math.max(feedback.length || 1, 1)) * 100, count ? 8 : 0)}%`,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="panel">
              <h2>Recent feedback</h2>
              <FeedbackTable
                rows={feedback.slice(0, 5)}
                onSelect={setSelected}
              />
            </section>
          </>
        )}
        {tab === "feedback" && (
          <section className="panel full">
            <div className="toolbar">
              <div className="search">
                <Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search feedback"
                />
              </div>
              <div className="filter-row">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {allFeedbackCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <FeedbackTable rows={filtered} onSelect={setSelected} />
          </section>
        )}
        {tab === "analytics" && (
          <section className="panel">
            <h2>Rating overview</h2>
            <div className="chart">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    {
                      label: "1 star",
                      responses: feedback.filter((f) => f.rating === 1).length,
                    },
                    {
                      label: "2 stars",
                      responses: feedback.filter((f) => f.rating === 2).length,
                    },
                    {
                      label: "3 stars",
                      responses: feedback.filter((f) => f.rating === 3).length,
                    },
                    {
                      label: "4 stars",
                      responses: feedback.filter((f) => f.rating === 4).length,
                    },
                    {
                      label: "5 stars",
                      responses: feedback.filter((f) => f.rating === 5).length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="responses"
                    fill="#bb8f45"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        {tab === "categories" && (
          <section className="panel full">
            <h2>Top feedback category</h2>
            <div className="category-list">
              {topCategories.length ? (
                topCategories.map(({ name, count }) => (
                  <button
                    key={name}
                    type="button"
                    className="category-row"
                    onClick={() => {
                      setCategoryFilter(name);
                      setStatus("all");
                      setTab("feedback");
                    }}
                  >
                    <div className="category-row-head">
                      <span>{name}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="category-track">
                      <span
                        style={{
                          width: `${(count / maxCategoryCount) * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <p className="empty-copy">No category data yet.</p>
              )}
            </div>
          </section>
        )}
        {tab === "locations" && (
          <section className="panel full">
            <div className="toolbar">
              <p>
                Active locations have a QR link guests can scan to submit
                feedback.
              </p>
              <button
                className="primary"
                onClick={() =>
                  setLocationForm({
                    code: "",
                    name: "",
                    zone: "apartment",
                    floor: "",
                    active: true,
                  })
                }
              >
                <Plus />
                Add location
              </button>
            </div>
            <div className="location-grid">
              {locations.map((loc) => (
                <article className="location-card" key={loc.id}>
                  <MapPinned />
                  <span
                    className={loc.active ? "status active-status" : "status"}
                  >
                    {loc.active ? "Active" : "Inactive"}
                  </span>
                  <h2>{loc.name}</h2>
                  <p>
                    {loc.code} · {zoneLabels[loc.zone] || loc.zone} · {loc.floor || "—"}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setLocationForm(loc)}
                  >
                    <Pencil />
                    Edit
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setLocationForm({ ...loc, showQr: true })}
                  >
                    <QrCode />
                    QR code
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "team" && (
          <section className="panel full">
            <h2>Team access</h2>
            <p className="muted">
              Administrators manage locations and access. Managers can review
              and resolve feedback.
            </p>
            {users.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || "—"}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.role || "manager"}
                          disabled={!isFirebaseConfigured}
                          onChange={async (e) => {
                            await updateUser(user.id, { role: e.target.value });
                            setUsers((all) =>
                              all.map((x) =>
                                x.id === user.id
                                  ? { ...x, role: e.target.value }
                                  : x,
                              ),
                            );
                          }}
                        >
                          <option value="manager">Manager</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td>
                        <span className="status active-status">
                          <ShieldCheck /> {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-copy">
                No team profiles found. Create a Firebase Auth user and then add
                its profile in the users collection.
              </p>
            )}
          </section>
        )}
      </section>
      {selected && (
        <CaseModal
          item={selected}
          onClose={() => setSelected(null)}
          onSave={saveCase}
        />
      )}{" "}
      {locationForm && (
        <LocationModal
          value={locationForm}
          onClose={() => setLocationForm(null)}
          onChange={setLocationForm}
          onSave={saveLoc}
        />
      )}
    </main>
  );
}
function FeedbackTable({ rows, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Location</th>
            <th>Rating</th>
            <th>Category</th>
            <th>Status</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row)}>
              <td>
                <strong>{row.feedbackId}</strong>
                {row.urgent && <span className="urgent-tag">Urgent</span>}
              </td>
              <td>{row.locationName}</td>
              <td className="rating">
                <Star fill="currentColor" /> {row.rating}
              </td>
              <td>{row.categories?.join(", ")}</td>
              <td>
                <span className={`status ${row.status}`}>
                  {row.status.replace("_", " ")}
                </span>
              </td>
              <td>{dateLabel(row.createdAt)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan="6" className="empty-copy">
                No feedback matches this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
function MailIcon(props) {
  return <Mail {...props} />;
}

function CaseModal({ item, onClose, onSave }) {
  const [note, setNote] = useState(item.resolutionNote || ""),
    [state, setState] = useState(item.status);
  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">Feedback case</p>
      <h2>{item.feedbackId}</h2>
      <p className="muted">
        {item.locationName} · {dateLabel(item.createdAt)}
      </p>
      <p className="case-rating">
        <Star fill="currentColor" /> {item.rating}/5
      </p>
      <p>
        <strong>Categories:</strong> {item.categories?.join(", ")}
      </p>
      {item.comment && <blockquote>{item.comment}</blockquote>}
      <label>
        Case status
        <select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label>
        Resolution note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Record actions taken…"
        />
      </label>
      <button
        className="primary"
        onClick={() => onSave({ status: state, resolutionNote: note })}
      >
        <CheckCircle2 />
        Save case
      </button>
      <button
        className="secondary"
        type="button"
        onClick={() =>
          openAutoReplyDraft({
            feedback: item,
            status: state,
            comment: note,
          })
        }
      >
        <MailIcon />
        Send status reply
      </button>
    </Modal>
  );
}
function LocationModal({ value, onClose, onChange, onSave }) {
  const url = `${window.location.origin}/f/${value.code}`;
  if (value.showQr)
    return (
      <Modal onClose={onClose}>
        <p className="eyebrow">Location QR code</p>
        <h2>{value.name}</h2>
        <div className="qr">
          <QRCodeSVG value={url} size={220} />
        </div>
        <p className="muted">{url}</p>
      </Modal>
    );
  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{value.id ? "Edit" : "New"} location</p>
      <h2>Location details</h2>
      <form className="modal-form" onSubmit={onSave}>
        <label>
          Location name
          <input
            required
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
        <label>
          Location code
          <input
            required
            value={value.code}
            onChange={(e) =>
              onChange({ ...value, code: e.target.value.toUpperCase() })
            }
          />
        </label>
        <label>
          Zone
          <select
            value={value.zone}
            onChange={(e) => onChange({ ...value, zone: e.target.value })}
          >
            {zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Floor / area
          <input
            value={value.floor}
            onChange={(e) => onChange({ ...value, floor: e.target.value })}
          />
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => onChange({ ...value, active: e.target.checked })}
          />{" "}
          Accept feedback responses
        </label>
        <button className="primary">
          <CheckCircle2 />
          Save location
        </button>
      </form>
    </Modal>
  );
}
