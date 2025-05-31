import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
  Container,
} from "@mui/material";
import "../App.css";
import logo from "./logo.png";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Récupération de l’état envoyé depuis la page inscription (si présent)
  const fromRegister = location.state?.fromRegister || false;
  const [showSuccessMessage, setShowSuccessMessage] = useState(fromRegister);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // redirection après connexion réussie
    } catch (err) {
      setError("Identifiants incorrects ou problème de connexion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMessage("");
    if (!resetEmail) {
      setResetMessage("Veuillez entrer votre adresse e-mail.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Email de réinitialisation envoyé. Vérifiez votre boîte mail.");
    } catch (err) {
      setResetMessage("Erreur lors de l'envoi de l'email. Vérifiez l'adresse.");
      console.error(err);
    }
  };

  return (
    
      
      <Container className="login-wrapper">



        <div className="login-left">
          <div className="welcome-text">
            <div className="welcome-circle"></div>
            <Typography variant="h3" className="welcome-title">
              Bienvenue sur <span>EduChat</span>
            </Typography>
            <Typography variant="body1" className="welcome-description">
              Discutez, échangez et apprenez en temps réel avec une communauté dynamique. Rejoignez-nous et transformez votre manière de collaborer.
            </Typography>
            <ul className="welcome-points">
              <li>💬 Discussions instantanées</li>
              <li>📚 Partage de ressources</li>
              <li>👥 Collaboration étudiante</li>
            </ul>
          </div>
        </div>

        <div className="login-right">
          <Paper elevation={3} className="login-paper">
              <Box textAlign="center" mb={2}>
    <img
      src={logo} // ou "/logo.png" si vous utilisez le dossier public
      alt="Logo EduChat"
      className="login-logo"
    />
  </Box>
                    {/* Message succès inscription */}
        {showSuccessMessage && (
          <Alert
            severity="success"
            onClose={() => setShowSuccessMessage(false)}
            sx={{ mb: 2 }}
          >
            Inscription réussie, vous pouvez maintenant vous connecter.
          </Alert>
        )}
            <Typography variant="h4" component="h1" className="login-title" gutterBottom>
              Connexion
            </Typography>

            {error && (
              <Alert severity="error" className="login-alert">
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <TextField
                label="Mot de passe"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </Box>

            <Box textAlign="right" mt={1}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setShowReset(!showReset)}
                className="forgot-password-link"
              >
                Mot de passe oublié ?
              </Link>
            </Box>

            {showReset && (
              <Box mt={2}>
                {resetMessage === "Email de réinitialisation envoyé. Vérifiez votre boîte mail." ? (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {resetMessage}
                  </Alert>
                ) : (
                  <>
                    <TextField
                      label="Votre email"
                      type="email"
                      fullWidth
                      margin="normal"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="login-input"
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handlePasswordReset}
                      className="login-button"
                    >
                      Envoyer l’email de réinitialisation
                    </Button>
                    {resetMessage && resetMessage !== "Email de réinitialisation envoyé. Vérifiez votre boîte mail." && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {resetMessage}
                      </Alert>
                    )}
                  </>
                )}
              </Box>
            )}

            <div className="register-footer">
              <Typography variant="body2">
                Pas de compte ?{" "}
                <Link href="/register" className="register-link">
                  S'inscrire
                </Link>
              </Typography>
            </div>
          </Paper>
        </div>
      </Container>
  );
};

export default LoginPage;
