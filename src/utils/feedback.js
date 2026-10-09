const point = (negative, moderate, positive) => ({ negative, moderate, positive });

const feedbackPointsByZone = {
  apartment: [
    point("Unhelpful staff", "Staff service could improve", "Helpful staff"),
    point("Maintenance issue", "Maintenance needs attention", "Well maintained"),
    point("Room not clean", "Cleanliness could improve", "Very clean"),
    point("Felt unsafe", "Security could improve", "Felt safe and secure"),
    point("Excessive noise", "Some noise disturbance", "Quiet and peaceful"),
    point("Uncomfortable room", "Room comfort could improve", "Comfortable room"),
    point("Missing amenities", "Amenities could improve", "Great amenities"),
    point("Air-conditioning issue", "Air conditioning could improve", "Excellent air conditioning"),
    point("Poor Wi-Fi", "Wi-Fi could improve", "Reliable Wi-Fi"),
    point("Water supply issue", "Water supply could improve", "Reliable water supply"),
  ],
  restaurant: [
    point("Poor food taste", "Food taste could improve", "Delicious food"),
    point("Poor food quality", "Food quality could improve", "Excellent food quality"),
    point("Limited menu", "More menu variety needed", "Great menu variety"),
    point("Unhelpful staff", "Staff service could improve", "Friendly staff"),
    point("Not clean", "Cleanliness could improve", "Very clean"),
    point("Service was too slow", "Service speed could improve", "Fast service"),
    point("Poor value for money", "Value could improve", "Good value for money"),
    point("Unpleasant ambience", "Ambience could improve", "Great ambience"),
    point("Uncomfortable seating", "Seating could improve", "Comfortable seating"),
  ],
  pool: [
    point("Pool area not clean", "Cleanliness could improve", "Very clean pool area"),
    point("Safety concern", "Safety measures could improve", "Felt safe"),
    point("Unhelpful staff", "Staff service could improve", "Helpful staff"),
    point("Facility issue", "Facilities could improve", "Excellent facilities"),
    point("Poor water quality", "Water quality could improve", "Excellent water quality"),
    point("Changing rooms not clean", "Changing rooms could improve", "Clean changing rooms"),
    point("Uncomfortable temperature", "Pool temperature could improve", "Perfect pool temperature"),
    point("Not enough loungers", "More loungers needed", "Comfortable loungers"),
    point("Inconvenient opening hours", "Opening hours could improve", "Convenient opening hours"),
  ],
  headOffice: [
    point("Unhelpful staff", "Staff service could improve", "Helpful staff"),
    point("Office not clean", "Cleanliness could improve", "Very clean"),
    point("Unpleasant environment", "Environment could improve", "Pleasant environment"),
    point("Security concern", "Security could improve", "Felt safe and secure"),
    point("Facility issue", "Facilities could improve", "Excellent facilities"),
    point("Poor reception service", "Reception service could improve", "Welcoming reception"),
    point("Long waiting time", "Waiting time could improve", "Quick service"),
    point("Unprofessional service", "Professionalism could improve", "Professional service"),
    point("Poor communication", "Communication could improve", "Clear communication"),
    point("Difficult to access", "Accessibility could improve", "Easy to access"),
  ],
  lobbyArea: [
    point("Lobby not clean", "Cleanliness could improve", "Very clean lobby"),
    point("Uncomfortable lobby", "Comfort could improve", "Comfortable lobby"),
    point("Security concern", "Security could improve", "Felt safe and secure"),
    point("Unhelpful staff", "Staff service could improve", "Helpful staff"),
    point("Unpleasant ambience", "Ambience could improve", "Welcoming ambience"),
    point("Poor reception service", "Reception service could improve", "Welcoming reception"),
    point("Not enough seating", "Seating could improve", "Comfortable seating"),
    point("Poor lighting", "Lighting could improve", "Pleasant lighting"),
    point("Uncomfortable temperature", "Temperature could improve", "Comfortable temperature"),
    point("Difficult to access", "Accessibility could improve", "Easy to access"),
  ],
  washroom: [
    point("Not clean", "Cleanliness could improve", "Very clean"),
    point("Supplies were missing", "Supplies need restocking", "Well stocked"),
    point("Maintenance issue", "Maintenance needs attention", "Well maintained"),
    point("Difficult to access", "Accessibility could improve", "Easy to access"),
    point("Unpleasant odour", "Odour control could improve", "Fresh and odour-free"),
    point("Water supply issue", "Water supply could improve", "Reliable water supply"),
    point("Poor lighting", "Lighting could improve", "Good lighting"),
    point("Hand-drying issue", "Hand-drying facilities could improve", "Good hand-drying facilities"),
    point("Privacy concern", "Privacy could improve", "Good privacy"),
  ],
};

export const getRatingBand = (rating) =>
  rating <= 2 ? "negative" : rating === 3 ? "moderate" : "positive";

export const categoriesByZone = Object.fromEntries(
  Object.entries(feedbackPointsByZone).map(([zone, points]) => [
    zone,
    {
      negative: [...points.map((item) => item.negative), "Other issue"],
      moderate: [...points.map((item) => item.moderate), "Other suggestion"],
      positive: [...points.map((item) => item.positive), "Something else"],
    },
  ]),
);

export const allFeedbackCategories = [
  ...new Set(
    Object.values(categoriesByZone).flatMap((bands) => Object.values(bands).flat()),
  ),
];

export function getCategoryCounts(feedback = []) {
  const counts = {};
  feedback.forEach((item) => {
    (item.categories || []).forEach((category) => {
      counts[category] = (counts[category] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function makeReference() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = crypto.getRandomValues(new Uint8Array(7));
  const code = Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  return `FB-${code}`;
}

export function validateDetails(values) {
  const errors = {};
  if (values.rating <= 3 && !values.comment.trim())
    errors.comment = "Please add a comment so we can understand what needs improvement.";
  if (values.comment.length > 1000)
    errors.comment = "Keep the comment under 1,000 characters.";
  if (values.customerName.length > 100)
    errors.customerName = "Keep the name under 100 characters.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "Enter a valid email address.";
  if (values.phone && !/^[+\d][\d\s()-]{6,24}$/.test(values.phone))
    errors.phone = "Enter a valid phone number.";
  return errors;
}
