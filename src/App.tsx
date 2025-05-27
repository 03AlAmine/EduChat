import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import GroupChatPage from "./pages/GroupChatPage";
import Register from "./pages/Register";
//import Intervention from './components/Intervention';

import ResetPasswordPage from "./pages/ResetPasswordPage";

import CreateGroupPage from "./pages/groupe/CreateGroup"; // Importer la page de création de groupe
import UserAdminControl from "./pages/user/UserAdminControl";
import Profile from "./pages/user/UserProfile";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Page d'accueil */}
          <Route path="/" element={<HomePage />} />

          <Route path="/register" element={<Register />} />

          <Route path="/reset" element={<ResetPasswordPage />} />
          {/*  <Route path="/intervention" element={<Intervention />} /> */}
          <Route path="/admin/users" element={<UserAdminControl />} />

          {/* Page de connexion */}
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Route admin protégée */}
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminPage />
              </PrivateRoute>
            }
          />

          {/* Page de création de groupe */}
          <Route path="/create-group" element={<CreateGroupPage />} />

          {/* Page utilisateur protégée */}
          <Route
            path="/user"
            element={
              <PrivateRoute>
                <UserPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/group/:groupId"
            element={
              <PrivateRoute>
                <GroupChatPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
