function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function computeScoreWithQuestions(questions, expectedObj, actualObj) {
  let total = 0;
  let matches = 0;

  for (const q of questions || []) {
    total++;

    const exp = expectedObj?.[q.id];
    const act = actualObj?.[q.id];

    if (q.type === "text") {
      if (normalizeText(exp) && normalizeText(exp) === normalizeText(act)) matches++;
    } else {
      // multiple_choice
      if (String(exp) === String(act)) matches++;
    }
  }

  const percent = total === 0 ? 0 : Math.round((matches / total) * 100);
  return { matches, total, percent };
}

module.exports = { computeScoreWithQuestions };
