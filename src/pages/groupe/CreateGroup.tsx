import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
} from "@mui/material";
// Si tu utilises Firestore :
import { db } from "../../services/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState(""); // Nouvel état pour la description
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) return; // Vérifie que les champs ne sont pas vides

    setLoading(true);
    try {
      await addDoc(collection(db, "groups"), {
        name: groupName,
        description: groupDescription, // Ajouter la description dans Firestore
        createdAt: Timestamp.now(),
      });

      alert("Groupe créé avec succès !");
      navigate("/user"); // ou la page où l’utilisateur doit être redirigé
    } catch (error) {
      console.error("Erreur lors de la création du groupe :", error);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={10} textAlign="center">
        <Typography variant="h4" gutterBottom>
          Créer un nouveau groupe
        </Typography>

        <Stack spacing={3} mt={4} alignItems="center">
          <TextField
            label="Nom du groupe"
            variant="outlined"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <TextField
            label="Description du groupe"
            variant="outlined"
            fullWidth
            multiline
            rows={4} // Permet plusieurs lignes pour la description
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)} // Mise à jour de la description
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateGroup}
            disabled={loading}
          >
            {loading ? "Création..." : "Créer le groupe"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default CreateGroup;
