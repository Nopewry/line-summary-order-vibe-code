export function getToday() {
  return new Date()
    .toLocaleDateString(
      "sv-SE",
      {
        timeZone: "Asia/Bangkok"
      }
    );
}

export function getTomorrow() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return date.toLocaleDateString(
    "sv-SE",
    {
      timeZone: "Asia/Bangkok"
    }
  );
}