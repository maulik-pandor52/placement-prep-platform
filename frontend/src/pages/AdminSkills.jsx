import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";

const emptyForm = {
  name: "",
  category: "",
  description: "",
};

export default function AdminSkills() {
  const token = localStorage.getItem("token");
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSkills(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Could not load skills.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
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
          `http://localhost:5000/api/admin/skills/${editingId}`,
          form,
          { headers },
        );
        setSkills((prev) =>
          prev.map((item) => (item._id === editingId ? res.data : item)),
        );
        setSuccess("Skill updated successfully.");
      } else {
        const res = await axios.post("http://localhost:5000/api/admin/skills", form, {
          headers,
        });
        setSkills((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccess("Skill created successfully.");
      }

      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not save skill.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/skills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSkills((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Skill deleted successfully.");
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not delete skill.",
      );
    }
  };

  return (
    <AdminLayout
      title="Skill Management"
      subtitle="Maintain the skills used throughout the student reports and quizzes."
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="admin-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {editingId ? "Edit Skill" : "Add Skill"}
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
              label="Skill Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Field
              label="Category"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
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
                  ? "Update Skill"
                  : "Create Skill"}
            </button>
          </form>
        </section>

        <section className="admin-card p-6">
          <h3 className="text-xl font-semibold text-white">Skill Catalog</h3>
          {loading ? (
            <p className="mt-4 text-slate-400">Loading skills...</p>
          ) : (
            <div className="mt-4 space-y-4">
              {skills.map((item) => (
                <div key={item._id} className="admin-card-muted p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.name}</div>
                      <div className="mt-1 text-sm text-cyan-300">{item.category}</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(item._id);
                          setForm({
                            name: item.name,
                            category: item.category || "",
                            description: item.description || "",
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
                  <p className="mt-3 text-sm text-slate-300">
                    {item.description || "No description added yet."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      <input {...props} className="admin-field" required />
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
