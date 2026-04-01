import logging
import os
from typing import Dict, List

from app.database import students_collection

logger = logging.getLogger(__name__)

VIS_DIR = "./visualizations"
os.makedirs(VIS_DIR, exist_ok=True)


def _risk_color(level: str) -> str:
    return {
        "HIGH": "#ef4444",
        "MEDIUM": "#f59e0b",
        "LOW": "#10b981",
    }.get(level, "#64748b")


async def generate_visualizations() -> Dict[str, int]:
    try:
        import matplotlib.pyplot as plt
    except Exception as exc:
        logger.warning("Visualization generation skipped: %s", exc)
        return {"generated": 0}

    students: List[dict] = await students_collection.find(
        {"risk_level": {"$exists": True}}
    ).to_list(None)

    if not students:
        return {"generated": 0}

    # Risk distribution
    levels = [s.get("risk_level", "UNKNOWN") for s in students]
    level_order = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"]
    counts = [levels.count(level) for level in level_order]

    plt.figure(figsize=(6, 4))
    bars = plt.bar(
        level_order,
        counts,
        color=[_risk_color(l) for l in level_order],
        edgecolor="#0f172a",
        linewidth=0.6,
    )
    plt.title("Risk Level Distribution")
    plt.ylabel("Students")
    for bar, value in zip(bars, counts):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5, str(value), ha="center", fontsize=9)
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, "risk_distribution.png"), dpi=160)
    plt.close()

    # Attendance vs Internal Marks
    attendance = [float(s.get("attendance_percentage", 0)) for s in students]
    marks = [float(s.get("internal_marks", 0)) for s in students]
    colors = [_risk_color(s.get("risk_level", "UNKNOWN")) for s in students]

    plt.figure(figsize=(6, 4))
    plt.scatter(attendance, marks, c=colors, alpha=0.7, edgecolors="white", linewidths=0.4)
    plt.title("Attendance vs Internal Marks")
    plt.xlabel("Attendance (%)")
    plt.ylabel("Internal Marks")
    plt.grid(True, linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, "attendance_vs_marks.png"), dpi=160)
    plt.close()

    # Risk score histogram
    scores = [float(s.get("risk_score", 0)) for s in students if s.get("risk_score") is not None]
    if scores:
        plt.figure(figsize=(6, 4))
        plt.hist(scores, bins=12, color="#60a5fa", edgecolor="#1e3a8a", alpha=0.85)
        plt.title("Risk Score Distribution")
        plt.xlabel("Risk Score")
        plt.ylabel("Students")
        plt.tight_layout()
        plt.savefig(os.path.join(VIS_DIR, "risk_score_hist.png"), dpi=160)
        plt.close()

    return {"generated": 3}
