import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { TextField, Button, Container, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // CSS global contenant les styles
import logo from './logo.png'; // Assurez-vous que le chemin est correct

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setIsCheckingUsername(true);
      setError('');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Ce pseudo est déjà utilisé');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        username: username.toLowerCase(),
        role: 'user',
        createdAt: new Date(),
      });

      // Redirection vers la page connexion après inscription réussie
navigate('/login', { state: { fromRegister: true } });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsCheckingUsername(false);
    }
  };

  return (
    <Container className="register-container">
      <div className="register-form">
        <Typography variant="h5" className="register-title" gutterBottom>
          Créer un compte
        </Typography>

        {error && <Typography className="register-error">{error}</Typography>}

        <TextField
          className="register-input"
          fullWidth
          label="Nom complet"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          className="register-input"
          fullWidth
          label="Pseudo (unique)"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          helperText="Ce pseudo sera visible par les autres utilisateurs"
        />
        <TextField
          className="register-input"
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          className="register-input"
          fullWidth
          label="Mot de passe"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          className="register-button"
          fullWidth
          variant="contained"
          onClick={handleRegister}
          disabled={isCheckingUsername}
        >
          {isCheckingUsername ? 'Vérification...' : "S'inscrire"}
        </Button>

        <div className="register-footer">
          <Typography variant="body2">
            Déjà un compte ?{' '}
            <Link href="/login" className="register-link">
              Se connecter
            </Link>
          </Typography>
        </div>
      </div>
<img src={logo} alt="Logo EduChat" className="register-logo" />

      <div className="register-welcome">
        <div className="welcome-text">
          <div className="welcome-circle"></div>
          <Typography variant="h3" className="welcome-title">
            Bienvenue sur <span>EduChat</span>
          </Typography>
          <Typography variant="body1" className="welcome-description">
            Discutez, échangez et apprenez en temps réel avec une communauté dynamique.
            Rejoignez-nous et transformez votre manière de collaborer.
          </Typography>
          <ul className="welcome-points">
            <li>💬 Discussions instantanées</li>
            <li>📚 Partage de ressources</li>
            <li>👥 Collaboration étudiante</li>
          </ul>
        </div>
      </div>
    </Container>
  );
};

export default Register;
