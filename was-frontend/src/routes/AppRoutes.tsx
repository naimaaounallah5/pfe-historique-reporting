import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "../layouts/MainLayout";
import { AchatsView } from "../features/dashboard/views";

const VueEnsemblePages = lazy(() => import("../features/vue-ensemble/views/vue-ensemble-pages"));
const DashboardPage    = lazy(() => import("../features/dashboard/views/DashboardPage"));
const ReportsPage      = lazy(() => import("../features/reports/views/ReportsPage"));
const OrdersPage       = lazy(() => import("../features/ordres-production/views/OrdersPage"));
const LoginPage        = lazy(() => import("../features/authentification/views/LoginPage"));
const HistoriqueView   = lazy(() => import("../features/query/views/HistoriqueView"));

const Loader = () => <div style={{ padding: "2rem" }}>Chargement...</div>;

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("lmobile_user");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Route publique */}
        <Route path="/login" element={
          <Suspense fallback={<Loader />}><LoginPage /></Suspense>
        } />

        {/* Routes protégées */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/"                 element={<Navigate to="/login" replace />} />
          <Route path="/vue-ensemble"     element={<Suspense fallback={<Loader />}><VueEnsemblePages /></Suspense>} />
          <Route path="/dashboard"        element={<Suspense fallback={<Loader />}><DashboardPage /></Suspense>} />
          <Route path="/dashboard/achats" element={<AchatsView />} />
          <Route path="/historique"       element={<Suspense fallback={<Loader />}><HistoriqueView /></Suspense>} />
          <Route path="/rapports"         element={<Suspense fallback={<Loader />}><ReportsPage /></Suspense>} />
          <Route path="/orders"           element={<Suspense fallback={<Loader />}><OrdersPage /></Suspense>} />
          <Route path="*"                 element={<Navigate to="/vue-ensemble" replace />} />
        </Route>


      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;