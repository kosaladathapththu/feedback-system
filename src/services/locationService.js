import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const previewLocations = [
  {
    id: "preview-apt-12",
    code: "APT-12",
    name: "Apartment 12",
    zone: "apartment",
    floor: "1",
    active: true,
  },
  {
    id: "preview-rst-01",
    code: "RST-01",
    name: "Rooftop Restaurant",
    zone: "restaurant",
    floor: "Roof",
    active: true,
  },
  {
    id: "preview-pool-01",
    code: "POOL-01",
    name: "Swimming Pool",
    zone: "pool",
    floor: "Ground",
    active: true,
  },
  {
    id: "preview-ho-01",
    code: "HO-01",
    name: "Head Office",
    zone: "headOffice",
    floor: "Ground",
    active: true,
  },
  {
    id: "preview-lobby-01",
    code: "LOB-01",
    name: "Lobby Area",
    zone: "lobbyArea",
    floor: "Lobby",
    active: true,
  },
  {
    id: "preview-wash-01",
    code: "WASH-01",
    name: "Washroom",
    zone: "washroom",
    floor: "Ground",
    active: true,
  },
];

export async function getLocationByCode(code) {
  const normalized = code.trim().toUpperCase();
  if (!db)
    return (
      previewLocations.find((location) => location.code === normalized) || null
    );
  const snapshot = await getDocs(
    query(
      collection(db, "locations"),
      where("code", "==", normalized),
      where("active", "==", true),
      limit(1),
    ),
  );
  return snapshot.empty
    ? null
    : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}
