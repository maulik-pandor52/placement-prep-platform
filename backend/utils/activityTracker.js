const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getDayKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateFromDayKey = (dayKey) => new Date(`${dayKey}T00:00:00`);

const normalizeActivityLog = (activityLog = []) =>
  activityLog
    .map((entry) => ({
      dayKey: entry.dayKey || getDayKey(entry.createdAt || new Date()),
      type: entry.type || "login",
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const addActivityToUser = (user, type, when = new Date()) => {
  if (!user) {
    return false;
  }

  if (!Array.isArray(user.activityLog)) {
    user.activityLog = [];
  }

  const dayKey = getDayKey(when);
  const alreadyExists = user.activityLog.some(
    (entry) => entry.dayKey === dayKey && entry.type === type,
  );

  if (alreadyExists) {
    return false;
  }

  user.activityLog.push({
    dayKey,
    type,
    createdAt: when,
  });

  return true;
};

const calculateStreaks = (sortedDayKeys = []) => {
  if (!sortedDayKeys.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let streak = 1;

  for (let index = 1; index < sortedDayKeys.length; index += 1) {
    const previous = toDateFromDayKey(sortedDayKeys[index - 1]);
    const current = toDateFromDayKey(sortedDayKeys[index]);
    const diffDays = Math.round((current - previous) / MS_PER_DAY);

    if (diffDays === 1) {
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const todayKey = getDayKey();
  const yesterdayKey = getDayKey(Date.now() - MS_PER_DAY);
  const descending = [...sortedDayKeys].sort((a, b) => (a < b ? 1 : -1));

  let currentStreak = 0;

  if (descending[0] === todayKey || descending[0] === yesterdayKey) {
    currentStreak = 1;
    let cursor = toDateFromDayKey(descending[0]);

    for (let index = 1; index < descending.length; index += 1) {
      const next = toDateFromDayKey(descending[index]);
      const diffDays = Math.round((cursor - next) / MS_PER_DAY);

      if (diffDays === 1) {
        currentStreak += 1;
        cursor = next;
      } else if (diffDays > 1) {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};

const buildActivitySummary = (activityLog = []) => {
  const normalized = normalizeActivityLog(activityLog);
  const byDay = new Map();

  normalized.forEach((entry) => {
    const current = byDay.get(entry.dayKey) || {
      dayKey: entry.dayKey,
      count: 0,
      types: new Set(),
      createdAt: entry.createdAt,
    };

    current.count += 1;
    current.types.add(entry.type);
    if (entry.createdAt > current.createdAt) {
      current.createdAt = entry.createdAt;
    }
    byDay.set(entry.dayKey, current);
  });

  const orderedDays = [...byDay.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const sortedDayKeys = orderedDays.map((item) => item.dayKey);
  const { currentStreak, longestStreak } = calculateStreaks(sortedDayKeys);
  const last30Days = [...byDay.values()]
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))
    .slice(0, 30)
    .map((item) => ({
      dayKey: item.dayKey,
      count: item.count,
      types: [...item.types],
    }));

  return {
    totalActiveDays: byDay.size,
    currentStreak,
    longestStreak,
    lastActiveDay: last30Days[0]?.dayKey || "",
    calendar: last30Days.reverse(),
  };
};

const getEngagementBadges = (totalActiveDays = 0) => {
  const badges = [];

  if (totalActiveDays >= 3) badges.push("Beginner Badge");
  if (totalActiveDays >= 7) badges.push("Consistent Learner");
  if (totalActiveDays >= 15) badges.push("Dedicated Performer");
  if (totalActiveDays >= 30) badges.push("Champion");

  return badges;
};

const syncEngagementBadges = (user) => {
  if (!user) {
    return [];
  }

  if (!Array.isArray(user.badges)) {
    user.badges = [];
  }

  const activitySummary = buildActivitySummary(user.activityLog || []);
  const earned = getEngagementBadges(activitySummary.totalActiveDays);
  user.badges = [...new Set([...(user.badges || []), ...earned])];
  return earned;
};

module.exports = {
  addActivityToUser,
  buildActivitySummary,
  getDayKey,
  getEngagementBadges,
  syncEngagementBadges,
};
