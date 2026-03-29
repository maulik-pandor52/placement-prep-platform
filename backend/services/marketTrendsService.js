const buildLiveTrendFallback = (company) => ({
  company: company.name,
  industry: company.industry || "Technology",
  topSkill: company.requiredSkills?.[0]?.name || company.focusSkills?.[0] || "General Skills",
  demandScore: company.benchmarkScore || 70,
  benchmarkScore: company.benchmarkScore || 70,
  growthLabel: "Dataset trend",
  topRoles: company.assessmentPattern?.slice(0, 2) || ["Campus assessment", "Technical round"],
  sourceLabel: "Curated company dataset",
  liveOpenings: 0,
  averageSalary: null,
  topLocation: "India",
  liveAvailable: false,
});

const average = (values = []) => {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

async function fetchAdzunaTrendForCompany(company) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return buildLiveTrendFallback(company);
  }

  const country = (company.jobApiCountry || process.env.ADZUNA_COUNTRY || "in").toLowerCase();
  const searchTerms = company.jobSearchTerms?.length
    ? company.jobSearchTerms
    : [company.name, ...(company.focusSkills || []).slice(0, 2)];
  const what = searchTerms.slice(0, 2).join(" ");

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "10",
      what,
      content_type: "application/json",
    });

    const response = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return buildLiveTrendFallback(company);
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    if (!results.length) {
      return {
        ...buildLiveTrendFallback(company),
        sourceLabel: "Live Adzuna query (no matching jobs found)",
      };
    }

    const salaries = results
      .map((job) => {
        const min = Number(job.salary_min) || 0;
        const max = Number(job.salary_max) || 0;
        if (!min && !max) return null;
        return max ? Math.round((min + max) / 2) : min;
      })
      .filter(Boolean);

    const titleCounts = new Map();
    const locationCounts = new Map();
    results.forEach((job) => {
      const title = String(job.title || "").trim();
      const location = String(job.location?.display_name || "").trim();
      if (title) titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
      if (location) locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });

    const topRole = [...titleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const topLocation = [...locationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const liveOpenings = Number(data.count) || results.length;
    const averageSalary = average(salaries);
    const demandScore = Math.min(98, Math.max(60, Math.round(62 + Math.log10(liveOpenings + 1) * 18)));

    return {
      company: company.name,
      industry: company.industry || "Technology",
      topSkill: company.requiredSkills?.[0]?.name || company.focusSkills?.[0] || "General Skills",
      demandScore,
      benchmarkScore: company.benchmarkScore || 70,
      growthLabel: liveOpenings >= 1000 ? "High live demand" : liveOpenings >= 200 ? "Active hiring" : "Niche openings",
      topRoles: [topRole, ...(company.assessmentPattern?.slice(0, 1) || [])].filter(Boolean),
      sourceLabel: "Live Adzuna market data",
      liveOpenings,
      averageSalary,
      topLocation: topLocation || "India",
      liveAvailable: true,
    };
  } catch {
    return buildLiveTrendFallback(company);
  }
}

async function fetchLiveMarketTrends(companies = []) {
  const selected = companies.slice(0, 5);
  const trends = await Promise.all(selected.map((company) => fetchAdzunaTrendForCompany(company)));
  return trends.sort((a, b) => b.demandScore - a.demandScore || b.benchmarkScore - a.benchmarkScore);
}

module.exports = {
  fetchLiveMarketTrends,
};
