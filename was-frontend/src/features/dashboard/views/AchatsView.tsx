// features/dashboard/views/AchatsView.tsx
import { useState } from "react";
import AchatsMontantView from "./AchatsMontantView";
import AchatsRetardView from "./AchatsRetardView";

const AchatsView = () => {
  const [activeTab, setActiveTab] = useState<"montant" | "retard">("montant");

  return (
    <div className="space-y-4">
      {/* ── Onglets ─────────────────────────── */}
      <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 w-fit">
        <button
          onClick={() => setActiveTab("montant")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "montant"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-100"
          }`}>
          📦 Montant Total Achats
        </button>
        <button
          onClick={() => setActiveTab("retard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "retard"
              ? "bg-red-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-100"
          }`}>
          ⏰ Retard Livraison
        </button>
      </div>

      {/* ── Contenu des onglets ─────────────── */}
      {activeTab === "montant" && <AchatsMontantView />}
      {activeTab === "retard" && <AchatsRetardView />}
    </div>
  );
};

export default AchatsView;