import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  List,
  Paper,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import {
  collection,
  query,
  onSnapshot,
  where,
  getDocs,
  doc,
  writeBatch,
  increment,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import {
  Group as GroupIcon,
  ExitToApp as LeaveIcon,
  Login as JoinIcon,
  Forum as ChatIcon,
} from "@mui/icons-material";
import "./pages.styles.css";

interface Group {
  id: string;
  name: string;
  slug: string; // Ajoutez cette ligne
  description?: string;
  createdAt?: Date;
  members?: string[];
  messagesTotal?: number;
  membresTotal?: number;
}

const UserPage: React.FC = () => {
  const [chatGroups, setChatGroups] = useState<Group[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // L'utilisateur est connecté, charger les données
        fetchGroups();
        setupUserGroupsListener(user.uid);
      } else {
        // L'utilisateur est déconnecté, réinitialiser les données
        setChatGroups([]);
        setJoinedGroupIds([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

const fetchGroups = async () => {
  setLoading(true);
  try {
    const groupsSnapshot = await getDocs(collection(db, "groups"));
    const groupsData = groupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug, // Récupérez le slug depuis Firestore
      description: doc.data().description,
      createdAt: doc.data().createdAt?.toDate(),
      members: doc.data().members || [],
      messagesTotal: doc.data().messagesTotal || 0,
      membresTotal: doc.data().membresTotal || 0,
    }));
    setChatGroups(groupsData);
  } catch (error) {
    console.error("Error fetching groups:", error);
  } finally {
    setLoading(false);
  }
};

  const setupUserGroupsListener = (userId: string) => {
    const q = query(
      collection(db, "userGroups"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupIds = snapshot.docs.map((doc) => doc.data().groupId);
      setJoinedGroupIds(groupIds);
    });

    return unsubscribe;
  };

  // Modifiez les fonctions handleJoinGroup et handleLeaveGroup
 const handleJoinGroup = async (groupId: string) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Veuillez vous connecter pour rejoindre un groupe");
    navigate("/login");
    return;
  }

  try {
    // Trouver le groupe correspondant pour obtenir son slug
    const group = chatGroups.find(g => g.id === groupId);
    if (!group) throw new Error("Groupe introuvable");

    const batch = writeBatch(db);

    const userGroupRef = doc(collection(db, "userGroups"));
    batch.set(userGroupRef, {
      userId: user.uid,
      groupId,
      joinedAt: new Date(),
    });

    const groupRef = doc(db, "groups", groupId);
    batch.update(groupRef, {
      membresTotal: increment(1),
    });

    await batch.commit();
    navigate(`/group/${group.slug}`); // Utilisez le slug ici
  } catch (error) {
    console.error("Erreur lors de l'adhésion:", error);
    alert("Une erreur est survenue");
  }
};

const handleLeaveGroup = async (groupId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "userGroups"),
    where("userId", "==", user.uid),
    where("groupId", "==", groupId)
  );

  try {
    // Vérifier d'abord le nombre actuel de membres
    const groupDoc = await getDoc(doc(db, "groups", groupId));
    const currentMemberCount = groupDoc.data()?.membresTotal || 0;

    // Utilisez une transaction batch
    const batch = writeBatch(db);

    // Supprimer de userGroups
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "userGroups", docSnap.id));
    });

    // Mettre à jour le compteur de membres seulement si > 0
    if (currentMemberCount > 0) {
      const groupRef = doc(db, "groups", groupId);
      batch.update(groupRef, {
        membresTotal: increment(-1),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Erreur lors du retrait:", error);
    alert("Impossible de quitter le groupe");
  }
};
  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box className="user-dashboard">
      <Paper className="user-header" elevation={0}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <ChatIcon fontSize="large" />
          <Typography variant="h4" component="h1">
            Groupes EduChat
          </Typography>
        </Box>
        <Typography variant="subtitle1" mt={1}>
          Rejoignez des groupes de discussion thématiques
        </Typography>
      </Paper>

      <Paper className="user-card">
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <GroupIcon color="primary" />
          <Typography variant="h6" component="h2">
            Groupes disponibles ({chatGroups.length})
          </Typography>
        </Box>

        <List className="group-list" disablePadding>
          {chatGroups.length > 0 ? (
            chatGroups.map((group) => {
              const isJoined = joinedGroupIds.includes(group.id);
              return (
                <React.Fragment key={group.id}>
                  <Box className="group-item">
                    <Box className="group-info">
                      <Typography className="group-name">
                        {group.name}
                        <Typography component="span" variant="caption" ml={1}>
                          ({group.membresTotal || 0} membres,{" "}
                          {group.messagesTotal || 0} messages)
                        </Typography>
                      </Typography>
                      <Typography className="group-description">
                        {group.description || "Aucune description disponible"}
                      </Typography>
                    </Box>
                    <Box className="group-actions">
{isJoined ? (
  <>
    <Button
      variant="contained"
      onClick={() => navigate(`/group/${group.slug}`)} // Utilisez group.slug ici
      className="user-btn primary-btn"
      startIcon={<ChatIcon />}
    >
      Ouvrir
    </Button>
    <Button
      variant="outlined"
      onClick={() => handleLeaveGroup(group.id)}
      className="user-btn danger-btn"
      startIcon={<LeaveIcon />}
    >
      Quitter
    </Button>
  </>
) : (
  <Button
    variant="contained"
    onClick={() => handleJoinGroup(group.id)}
    className="user-btn primary-btn"
    startIcon={<JoinIcon />}
  >
    Rejoindre
  </Button>
)}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              );
            })
          ) : (
            <Typography
              variant="body1"
              color="textSecondary"
              textAlign="center"
              py={3}
            >
              Aucun groupe disponible pour le moment
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default UserPage;
