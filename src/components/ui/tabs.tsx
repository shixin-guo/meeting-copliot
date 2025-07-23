import type React from "react";
import { useState, type ReactNode } from "react";

interface Tab {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, className }) => {
  const [selected, setSelected] = useState(0);
  return (
    <div className={className}>
      <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setSelected(idx)}
            style={{
              padding: "4px 8px",
              border: "none",
              borderBottom: selected === idx ? "2px solid #007bff" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: selected === idx ? "500" : "normal",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 12 }}>{tabs[selected].content}</div>
    </div>
  );
};
