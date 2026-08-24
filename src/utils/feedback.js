export const categoriesByZone = {
  apartment: [
    "Staff Service",
    "Maintenance",
    "Cleanliness",
    "Security",
    "Noise",
    "Other",
  ],
  restaurant: [
    "Food Taste",
    "Staff Service",
    "Cleanliness",
    "Speed",
    "Price",
    "Other",
  ],
  pool: [
    "Cleanliness",
    "Safety",
    "Staff Service",
    "Equipment / Facility",
    "Other",
  ],
  washroom: ["Cleanliness", "Supplies", "Maintenance", "Other"],
};

export function makeReference(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return `FB-${day}-${String(suffix).padStart(4, "0")}`;
}

export function validateDetails(values) {
  const errors = {};
  if (values.comment.length > 1000)
    errors.comment = "Keep the comment under 1,000 characters.";
  if (values.customerName.length > 100)
    errors.customerName = "Keep the name under 100 characters.";
  if (values.phone && !/^[+\d][\d\s()-]{6,24}$/.test(values.phone))
    errors.phone = "Enter a valid phone number.";
  return errors;
}
