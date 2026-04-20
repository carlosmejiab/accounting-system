import { useState, useRef, useEffect } from "react";

export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select...",
  isMulti = true,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (opt) => {
    if (disabled) return;
    if (!isMulti) {
      onChange([opt]);
      setOpen(false);
      setSearch("");
      return;
    }
    const exists = value.find((v) => v.value === opt.value);
    onChange(
      exists
        ? value.filter((v) => v.value !== opt.value)
        : [...value, opt]
    );
  };

  const selectedLabels = value.slice(0, 2);
  const extraCount = value.length - 2;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* ── Trigger ───────────────────────────────────────────────── */}
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: open ? "1px solid #4361ee" : "1px solid #e0e0e0",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: 40,
          background: disabled ? "#f9fafb" : "#fff",
          gap: 6,
          opacity: disabled ? 0.65 : 1,
          boxShadow: open ? "0 0 0 3px rgba(67,97,238,0.1)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
          {value.length === 0 && (
            <span style={{ color: "#9ca3af", fontSize: 14 }}>{placeholder}</span>
          )}
          {selectedLabels.map((v) => (
            <span
              key={v.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#EEEDFE",
                color: "#3C3489",
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              {v.label}
              {!disabled && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  style={{ cursor: "pointer", color: "#7F77DD", fontWeight: "bold", lineHeight: 1 }}
                >
                  ×
                </span>
              )}
            </span>
          ))}
          {extraCount > 0 && (
            <span
              style={{
                background: "#7F77DD",
                color: "#fff",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              +{extraCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────── */}
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 13,
                background: "transparent",
                color: "#374151",
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                No results found
              </div>
            )}
            {filtered.map((opt) => {
              const sel = !!value.find((v) => v.value === opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggle(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    background: sel ? "#f5f3ff" : "transparent",
                    color: sel ? "#534AB7" : "#374151",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!sel) e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!sel) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Checkbox indicator */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: sel ? "none" : "1.5px solid #d1d5db",
                      borderRadius: 4,
                      background: sel ? "#7F77DD" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {sel && (
                      <svg width="9" height="7" viewBox="0 0 9 7">
                        <polyline
                          points="1,4 3.5,6 8,1"
                          stroke="white"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  {opt.label}
                </div>
              );
            })}
          </div>

          {/* Footer actions (multi only) */}
          {isMulti && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 12px",
                borderTop: "1px solid #f3f4f6",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(options);
                }}
                style={{
                  fontSize: 12,
                  color: "#534AB7",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Select all
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
