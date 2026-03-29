import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";

const emptyForm = {
  question: "",
  options: ["", "", "", ""],
  answer: 0,
  skill: "",
  category: "",
  company: "",
};

export default function AdminQuestions() {
  const token = localStorage.getItem("token");
  const [questions, setQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [questionsRes, skillsRes, companiesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/questions", { headers }),
          axios.get("http://localhost:5000/api/admin/skills", { headers }),
          axios.get("http://localhost:5000/api/admin/companies", { headers }),
        ]);

        setQuestions(questionsRes.data);
        setSkills(skillsRes.data);
        setCompanies(companiesRes.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Could not load questions.",
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

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        answer: Number(form.answer),
        options: form.options.map((item) => item.trim()).filter(Boolean),
      };
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        const res = await axios.put(
          `http://localhost:5000/api/admin/questions/${editingId}`,
          payload,
          { headers },
        );
        setQuestions((prev) =>
          prev.map((item) => (item._id === editingId ? res.data : item)),
        );
        setSuccess("Question updated successfully.");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/admin/questions",
          payload,
          { headers },
        );
        setQuestions((prev) => [res.data, ...prev]);
        setSuccess("Question created successfully.");
      }

      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not save question.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      question: item.question,
      options: [...item.options, "", "", "", ""].slice(0, 4),
      answer: item.answer,
      skill: item.skill || "",
      category: item.category || "",
      company: item.company || "",
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Question deleted successfully.");
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not delete question.",
      );
    }
  };

  return (
    <AdminLayout
      title="Question Management"
      subtitle="Create, edit, and remove quiz questions from the central question bank."
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              {editingId ? "Edit Question" : "Add Question"}
            </h3>
            {editingId ? (
              <button
                onClick={resetForm}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Question
              </label>
              <textarea
                rows={3}
                value={form.question}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, question: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {form.options.map((option, index) => (
                <div key={index}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Option {index + 1}
                  </label>
                  <input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    required={index < 2}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput
                label="Correct Option Index"
                type="number"
                min="0"
                max="3"
                value={form.answer}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, answer: e.target.value }))
                }
              />
              <FormInput
                label="Skill"
                value={form.skill}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, skill: e.target.value }))
                }
                list="skills-list"
              />
              <FormInput
                label="Category"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
              />
              <FormInput
                label="Company"
                value={form.company}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, company: e.target.value }))
                }
                list="companies-list"
                required={false}
              />
            </div>

            <datalist id="skills-list">
              {skills.map((item) => (
                <option key={item._id} value={item.name} />
              ))}
            </datalist>
            <datalist id="companies-list">
              {companies.map((item) => (
                <option key={item._id} value={item.name} />
              ))}
            </datalist>

            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                saving ? "cursor-wait bg-cyan-400" : "bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              {saving
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                  ? "Update Question"
                  : "Create Question"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Question Bank</h3>
          {loading ? (
            <p className="mt-4 text-slate-600">Loading questions...</p>
          ) : (
            <div className="mt-4 space-y-4">
              {questions.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="font-medium text-slate-900">{item.question}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <Tag label={`Skill: ${item.skill}`} />
                    <Tag label={`Category: ${item.category}`} />
                    {item.company ? <Tag label={`Company: ${item.company}`} /> : null}
                    <Tag label={`Answer: ${item.answer}`} />
                  </div>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                    {item.options.map((option, index) => (
                      <li key={`${item._id}-${index}`}>{option}</li>
                    ))}
                  </ol>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
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

function FormInput({ label, required = true, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        required={required}
      />
    </div>
  );
}

function Tag({ label }) {
  return <span className="rounded-full bg-white px-3 py-1">{label}</span>;
}

function Notice({ children, tone }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
