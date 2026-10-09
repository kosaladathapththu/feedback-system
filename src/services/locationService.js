import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const apartmentNumbers = [
  401, 402, 403, 404, 405, 406,
  501, 502, 503, 504, 505, 506,
  601, 602, 603, 604, 605, 606,
  701, 702, 703,
];

const previewLocations = [
  ...apartmentNumbers.map((number) => ({
    id: `preview-apt-${number}`,
    code: `APT-${number}`,
    name: `Apartment ${number}`,
    zone: "apartment",
    floor: String(number)[0],
    active: true,
  })),
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
