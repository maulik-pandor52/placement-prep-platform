import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const axisColor = "rgba(148, 163, 184, 0.35)";
const labelColor = "#cbd5e1";

export function ScoreTrendChart({ results = [] }) {
  const trimmedResults = [...results]
    .slice(0, 8)
    .reverse();

  const data = {
    labels: trimmedResults.map((item, index) =>
      item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : `Run ${index + 1}`,
    ),
    datasets: [
      {
        label: "Score %",
        data: trimmedResults.map((item) =>
          item.total ? Math.round((item.score / item.total) * 100) : 0,
        ),
        borderRadius: 12,
        backgroundColor: [
          "rgba(139, 92, 246, 0.88)",
          "rgba(34, 211, 238, 0.88)",
          "rgba(139, 92, 246, 0.72)",
          "rgba(34, 211, 238, 0.72)",
          "rgba(139, 92, 246, 0.6)",
          "rgba(34, 211, 238, 0.6)",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: labelColor },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: labelColor },
        grid: { color: axisColor },
      },
    },
  };

  return (
    <div className="chart-shell">
      <Bar data={data} options={options} />
    </div>
  );
}

export function BreakdownDoughnutChart({ title, items = [] }) {
  const labels = items.map((item) => item.label);
  const values = items.map((item) => item.percentage);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderWidth: 0,
        backgroundColor: [
          "rgba(139, 92, 246, 0.9)",
          "rgba(34, 211, 238, 0.9)",
          "rgba(16, 185, 129, 0.9)",
          "rgba(249, 115, 22, 0.9)",
          "rgba(244, 114, 182, 0.9)",
          "rgba(96, 165, 250, 0.9)",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: labelColor,
          usePointStyle: true,
          boxWidth: 10,
          padding: 16,
        },
      },
      title: { display: false },
    },
    cutout: "62%",
  };

  return (
    <section className="section-panel">
      <h2 className="panel-title">{title}</h2>
      {items.length ? (
        <div className="chart-shell chart-shell-tall mt-5">
          <Doughnut data={data} options={options} />
        </div>
      ) : (
        <div className="empty-state mt-5">Chart will appear after more scored data is available.</div>
      )}
    </section>
  );
}
