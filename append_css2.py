import os

css_append = """
/* ── Cadence Selector ─────────────────────────────────────────── */
.cadence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.cadence-selector {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 4px;
}

.cadence-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cadence-btn.active {
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

/* ── Dual Items UI ────────────────────────────────────────────── */
.dual-items-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.meal-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.meal-item-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(45, 212, 191, 0.2);
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.item-cat {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.item-qty-badge {
  background: var(--bg-primary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  border: 1px solid var(--border-subtle);
}

.meal-card-professional {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
"""

with open(r"d:\my_project\src\index.css", "a", encoding="utf-8") as f:
    f.write(css_append)
