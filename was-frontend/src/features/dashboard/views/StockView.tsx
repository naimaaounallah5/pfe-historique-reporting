// features/dashboard/views/StockView.tsx
import { useState } from "react";
import StockDisponibleView from "../views/StockDisponibleView";
import StockRotationView from "../views/StockRotationView";

const StockView = () => {
  const [activeTab, setActiveTab] = useState<"disponible" | "rotation">("disponible");

  return (
    <div className="space-y-4">
      {/* ── Onglets ─────────────────────────── */}
      <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 w-fit">
        <button
          onClick={() => setActiveTab("disponible")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "disponible"
              ? "bg-amber-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-100"
          }`}>
          📦 Stock Disponible
        </button>
        <button
          onClick={() => setActiveTab("rotation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "rotation"
              ? "bg-purple-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-100"
          }`}>
          🔄 Taux de Rotation
        </button>
      </div>

      {/* ── Contenu des onglets ─────────────── */}
      {activeTab === "disponible" && <StockDisponibleView />}
      {activeTab === "rotation" && <StockRotationView />}
    </div>
  );
};

export default StockView;