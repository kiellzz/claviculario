import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Salas from "./pages/Salas";
import Usuarios from "./pages/Usuarios";
import Layout from "./components/Layout";
import Autorizacoes from "./pages/Autorizacoes";
import Config from "./pages/Config";
import Coordenador from "./pages/Coordenador";
import ButtonPage from "./pages/Button";
import ProtectedRoute from "./components/ProtectedRoute";
import CoordinatorRoute from "./components/CoordinatorRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota inicial leva para o Login */}
        <Route path="/" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/salas" element={<Salas />} />
            <Route element={<CoordinatorRoute />}>
              <Route path="/coordenador" element={<Coordenador />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/autorizacoes" element={<Autorizacoes />} />
              <Route path="/configuracoes" element={<Config />} />
              <Route path="/button" element={<ButtonPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
