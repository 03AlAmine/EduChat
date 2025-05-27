import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,

} from 'firebase/firestore';

import {
  Typography,
  Button,
  Box,
  Paper,
  Divider,
  useTheme,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';

import {
  Chat as ChatIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Group as GroupIcon,
  RocketLaunch as RocketLaunchIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Lock as LockIcon,
  NotificationsActive as NotificationsIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';

import { motion } from 'framer-motion';
import AdminPage from './AdminPage';
import './styles.css';

interface Group {
  id: string;
  name: string;
  description?: string;
  members?: string[]; // Liste des IDs des membres
  membersCount?: number; // Nombre de membres (peut être calculé)
  messagesTotal?: number; // Total des messages
  membresTotal?: number;  // Total des membres (alternative à membersCount)
  lastActivity?: Date;
}

const UserDash: React.FC = () => {
  const theme = useTheme();
  const { currentUser, isAdmin, userData } = useAuth();
  const navigate = useNavigate();

  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setShowScrollTop] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setJoinedGroups([]);
      setLoading(false);
      return;
    }

const fetchUserGroups = async () => {
  try {
    const q = query(
      collection(db, 'userGroups'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const groupIds = snapshot.docs.map(doc => doc.data().groupId);
      
      if (groupIds.length === 0) {
        setJoinedGroups([]);
        setLoading(false);
        return;
      }

      const groupsQuery = query(
        collection(db, 'groups'),
        where('__name__', 'in', groupIds)
      );

      const groupsSnapshot = await getDocs(groupsQuery);
      const groupsData: Group[] = [];

      for (const doc of groupsSnapshot.docs) {
        // Récupérer le nombre de messages
        const messagesQuery = query(
          collection(db, 'groups', doc.id, 'messages')
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        
        groupsData.push({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description,
          members: doc.data().members || [],
          membersCount: doc.data().members?.length || 0,
          messagesTotal: doc.data().messagesTotal || messagesSnapshot.size, // Utilise le champ ou compte les messages
          membresTotal: doc.data().membresTotal || doc.data().members?.length || 0,
          lastActivity: doc.data().lastActivity?.toDate() || doc.data().createdAt?.toDate()
        });
      }

      setJoinedGroups(groupsData.sort((a, b) => 
        (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0)
      ));
      setLoading(false);
    });

    return () => unsubscribe();
  } catch (error) {
    console.error("Error fetching user groups:", error);
    setLoading(false);
  }
};

    fetchUserGroups();
  }, [currentUser]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pb: 6 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          mb: 4,
          textAlign: 'center',
          boxShadow: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            left: -50,
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            transform: 'rotate(30deg)',
          }
        }}
        component={motion.section}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box position="relative" zIndex={1}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            Bienvenue, {userData?.name || 'cher utilisateur'}!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, fontStyle: 'italic' }}>
            EduChat, votre espace privilégié pour apprendre et échanger
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/user')}
              startIcon={<PeopleIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                boxShadow: theme.shadows[4],
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[6],
                },
                transition: 'all 0.3s ease',
              }}
            >
              Explorer les groupes
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => navigate('/profile')}
              startIcon={<AccountCircleIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Mon profil
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleLogout}
              startIcon={<ExitToAppIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderWidth: 2,
                color: theme.palette.error.light,
                borderColor: theme.palette.error.light,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(244,67,54,0.1)',
                  borderColor: theme.palette.error.main,
                },
              }}
            >
              Déconnexion
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* User Groups Section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 4,
          boxShadow: theme.shadows[2],
          background: 'linear-gradient(to bottom, #ffffff, #f9faff)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} fontSize="large" />
            Mes groupes de discussion
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/user')}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Nouveau groupe
          </Button>
        </Box>

        {joinedGroups.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 3,
              background: 'rgba(0,0,0,0.02)',
            }}
          >
            <ForumIcon sx={{ fontSize: 60, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Aucun groupe rejoint
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Rejoignez des groupes pour commencer à échanger avec vos collègues et partager vos connaissances
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/user')}
              size="large"
              sx={{ borderRadius: 2, px: 4 }}
            >
              Découvrir les groupes
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {joinedGroups.map((group) => (
              <Paper
                key={group.id}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  background: 'white',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.light,
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}
                elevation={0}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>
                    {group.name}
                  </Typography>
<Chip
  label={`${group.membresTotal || group.membersCount || 0} membres • ${group.messagesTotal || 0} messages`}
  size="small"
  color="primary"
  variant="outlined"
  sx={{ fontWeight: 600 }}
/>
                  
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {group.description || 'Aucune description fournie'}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, fontStyle: 'italic' }}>
                  Dernière activité: {group.lastActivity?.toLocaleString() || 'aucune activité'}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/group/${group.id}`)}
                    startIcon={<ChatIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      fontWeight: 600,
                    }}
                  >
                    Accéder
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      if (window.confirm(`Quitter le groupe "${group.name}" ?`)) {
                        // handleLeaveGroup(group.id);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      fontWeight: 600,
                    }}
                  >
                    Quitter
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Features Section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          boxShadow: theme.shadows[2],
          background: 'linear-gradient(to bottom, #f8f9fe, #ffffff)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          <RocketLaunchIcon sx={{ mr: 1.5, verticalAlign: 'middle', color: theme.palette.primary.main }} />
          Pourquoi choisir EduChat ?
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: 3,
          }}
        >
          {[
            {
              icon: <ChatIcon color="primary" sx={{ fontSize: 50 }} />,
              title: 'Conversations fluides',
              description: 'Échangez en temps réel avec une interface intuitive et réactive',
            },
            {
              icon: <LockIcon color="primary" sx={{ fontSize: 50 }} />,
              title: 'Sécurité renforcée',
              description: 'Vos données sont protégées par un chiffrement de pointe',
            },
            {
              icon: <FavoriteIcon color="primary" sx={{ fontSize: 50 }} />,
              title: 'Communauté bienveillante',
              description: 'Rejoignez une communauté active et collaborative',
            },
            {
              icon: <NotificationsIcon color="primary" sx={{ fontSize: 50 }} />,
              title: 'Notifications intelligentes',
              description: 'Restez informé sans être submergé par les alertes',
            },
          ].map((feature, index) => (
            <Box
              key={index}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                textAlign: 'center',
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box sx={{ 
                mb: 2,
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(79, 70, 229, 0.1)',
              }}>
                {feature.icon}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: theme.palette.primary.dark }}>
                {feature.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">{feature.description}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>



      {/* Footer */}
      <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2">
          © {new Date().getFullYear()} EduChat - Tous droits réservés
        </Typography>
      </Box>
    </Box>
  );
};

export default UserDash;