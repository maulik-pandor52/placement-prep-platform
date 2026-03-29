import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";

const emptyForm = {
  name: "",
  description: "",
  focusSkills: "",
  preferredCategories: "",
  hiringFocus: "",
  assessmentPattern: "",
  benchmarkScore: 70,
  difficultyLevel: "medium",
  jobApiCountry: "in",
  jobSearchTerms: "",
};

export default function AdminCompanies() {
  const token = localStorage.getItem("token");
  const [companies, setCompanies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [companiesRes, skillsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/companies", { headers }),
          axios.get("http://localhost:5000/api/admin/skills", { headers }),
        ]);

        setCompanies(companiesRes.data);
        setSkills(skillsRes.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Could not load companies.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        const res = await axios.put(
          `http://localhost:5000/api/admin/companies/${editingId}`,
          form,
          { headers },
        );
        setCompanies((prev) =>
          prev.map((item) => (item._id === editingId ? res.data : item)),
        );
        setSuccess("Company updated successfully.");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/admin/companies",
          form,
          { headers },
        );
        setCompanies((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccess("Company created successfully.");
      }

      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not save company.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Company deleted successfully.");
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not delete company.",
      );
    }
  };

  return (
    <AdminLayout
      title="Company Management"
      subtitle="Maintain company profiles and focus areas used in company-specific tests."
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="admin-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {editingId ? "Edit Company" : "Add Company"}
            </h3>
            {editingId ? (
              <button
                onClick={resetForm}
                className="text-sm font-medium text-slate-400 hover:text-white"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field
              label="Company Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="admin-field min-h-[120px]"
              />
            </div>
            <Field
              label="Focus Skills"
              value={form.focusSkills}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, focusSkills: e.target.value }))
              }
              placeholder="React, Node.js, Aptitude"
              list="skills-list"
            />
            <Field
              label="Preferred Categories"
              value={form.preferredCategories}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, preferredCategories: e.target.value }))
              }
              placeholder="Frontend, Backend, Aptitude"
            />
            <Field
              label="Hiring Focus"
              value={form.hiringFocus}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hiringFocus: e.target.value }))
              }
              required={false}
            />
            <Field
              label="Assessment Pattern"
              value={form.assessmentPattern}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, assessmentPattern: e.target.value }))
              }
              placeholder="Aptitude MCQs, Technical MCQs, Coding round"
              required={false}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Benchmark Score"
                type="number"
                min="0"
                max="100"
                value={form.benchmarkScore}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, benchmarkScore: e.target.value }))
                }
              />
              <Field
                label="Difficulty"
                value={form.difficultyLevel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, difficultyLevel: e.target.value }))
                }
              />
              <Field
                label="Job API Country"
                value={form.jobApiCountry}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, jobApiCountry: e.target.value }))
                }
              />
            </div>
            <Field
              label="Job Search Terms"
              value={form.jobSearchTerms}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, jobSearchTerms: e.target.value }))
              }
              placeholder="Infosys React Developer, Infosys Graduate Engineer"
              required={false}
            />

            <datalist id="skills-list">
              {skills.map((item) => (
                <option key={item._id} value={item.name} />
              ))}
            </datalist>

            <button
              type="submit"
              disabled={saving}
              className={`admin-btn ${
                saving ? "cursor-wait opacity-70" : ""
              }`}
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Company"
                  : "Create Company"}
            </button>
          </form>
        </section>

        <section className="admin-card p-6">
          <h3 className="text-xl font-semibold text-white">Company Profiles</h3>
          {loading ? (
            <p className="mt-4 text-slate-400">Loading companies...</p>
          ) : (
            <div className="mt-4 space-y-4">
              {companies.map((item) => (
                <div key={item._id} className="admin-card-muted p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.name}</div>
                      <p className="mt-2 text-sm text-slate-300">
                        {item.description || "No description added yet."}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(item._id);
                          setForm({
                            name: item.name,
                            description: item.description || "",
                            focusSkills: (item.focusSkills || []).join(", "),
                            preferredCategories: (item.preferredCategories || []).join(", "),
                            hiringFocus: item.hiringFocus || "",
                            assessmentPattern: (item.assessmentPattern || []).join(", "),
                            benchmarkScore: item.benchmarkScore || 70,
                            difficultyLevel: item.difficultyLevel || "medium",
                            jobApiCountry: item.jobApiCountry || "in",
                            jobSearchTerms: (item.jobSearchTerms || []).join(", "),
                          });
                          setError("");
                          setSuccess("");
                        }}
                        className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:brightness-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="rounded-xl border border-rose-400/20 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-100">Focus Skills:</span>{" "}
                      {(item.focusSkills || []).length
                        ? item.focusSkills.join(", ")
                        : "None added"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100">Preferred Categories:</span>{" "}
                      {(item.preferredCategories || []).length
                        ? item.preferredCategories.join(", ")
                        : "None added"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100">Hiring Focus:</span>{" "}
                      {item.hiringFocus || "Not set"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100">Job Search Terms:</span>{" "}
                      {(item.jobSearchTerms || []).length
                        ? item.jobSearchTerms.join(", ")
                        : "Using company/focus fallback"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function Field({ label, required = true, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      <input {...props} className="admin-field" required={required} />
    </div>
  );
}

function Notice({ children, tone }) {
  const styles =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-rose-400/20 bg-rose-400/10 text-rose-200";

  return (
    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
