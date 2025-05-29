import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  Badge,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import WarningIcon from "@mui/icons-material/Warning";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import "./Notifications.css";

interface Notification {
  id: string;
  userId: string;
  content: string;
  type: string;
  createdAt: Date;
  read: boolean;
  senderUsername?: string;
  groupName?: string;
  originalMessage?: string;
  senderAvatar?: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeNotif = onSnapshot(
        q,
        (snapshot) => {
          const notifList = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
            } as Notification;
          });
          setNotifications(notifList);
          setLoading(false);
        },
        (err) => {
          console.error("Erreur Firestore:", err);
          setError(
            "Erreur lors du chargement des notifications. L'index est peut-être en cours de construction."
          );
          setLoading(false);
        }
      );

      return () => unsubscribeNotif();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notifId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      await Promise.all(
        unreadNotifications.map(notif => 
          updateDoc(doc(db, "notifications", notif.id), { read: true }
        )
      ));
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  if (loading) {
    return (
      <Box className="notification-loading-container">
        <CircularProgress size={60} thickness={4} className="notification-loading-spinner" />
        <Typography variant="body1" className="notification-loading-text">
          Chargement de vos notifications...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="notification-error-container">
        <Box className="notification-error-card">
          <WarningIcon color="error" className="notification-error-icon" />
          <Typography variant="h6" className="notification-error-title">
            Oups, une erreur est survenue
          </Typography>
          <Typography className="notification-error-message">{error}</Typography>
          <Button 
            variant="contained" 
            className="notification-error-button"
            onClick={() => window.location.reload()}
            startIcon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>}
          >
            Réessayer
          </Button>
        </Box>
      </Box>
    );
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <Box className="notification-container">
      <Paper className="notification-card">
        {/* Header */}
        <Box className="notification-header">
          <Box className="notification-header-content">
            <Tooltip title="Retour" arrow>
              <IconButton 
                className="notification-back-button"
                onClick={() => navigate(-1)}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <NotificationsActiveIcon color="primary" className="notification-icon" />
            <Typography variant="h5" className="notification-title">
              Historique des notifications
              <Chip
                label={`${notifications.length} ${notifications.length === 1 ? "notification" : "notifications"}`}
                size="small"
                className="notification-count"
                variant="outlined"
              />
            </Typography>
          </Box>

          <Button
            variant="outlined"
            className="notification-mark-all-button"
            startIcon={<CheckCircleIcon />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            size="small"
          >
            Tout marquer comme lu
          </Button>
        </Box>

        {/* Notifications List */}
        <List className="notification-list">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="notification-empty-state"
              >
                <NotificationsOffIcon className="notification-empty-icon" />
                <Typography variant="h6" className="notification-empty-title">
                  Aucune notification
                </Typography>
                <Typography variant="body2" className="notification-empty-message">
                  Vous serez notifié ici lorsqu'il y aura de nouvelles activités
                </Typography>
              </motion.div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <ListItem
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    secondaryAction={
                      !notification.read && (
                        <Tooltip title="Marquer comme lu" arrow>
                          <IconButton
                            edge="end"
                            className="notification-mark-button"
                            onClick={() => markAsRead(notification.id)}
                            size="small"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    {!notification.read && (
                      <Box className="notification-badge"></Box>
                    )}

                    <ListItemAvatar className="notification-avatar-container">
                      <Avatar 
                        src={notification.senderAvatar}
                        className="notification-avatar"
                        alt={notification.senderUsername}
                      >
                        {notification.senderUsername?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box className="notification-content-wrapper">
                          <Box className="notification-meta">
                            <Typography component="span" className="notification-sender">
                              {notification.senderUsername || "Utilisateur inconnu"}
                            </Typography>
                            <Typography component="span" className="notification-separator">
                              •
                            </Typography>
                            <Typography component="span" className="notification-group">
                              {notification.groupName || "Groupe inconnu"}
                            </Typography>
                            <Typography component="span" className="notification-separator">
                              •
                            </Typography>
                            <Chip
                              label={notification.type}
                              size="small"
                              className="notification-type"
                            />
                          </Box>

                          <Typography variant="body1" className="notification-content">
                            {notification.content}
                          </Typography>

                          {notification.originalMessage && (
                            <Paper elevation={0} className="notification-original-message">
                              <Typography variant="caption" className="notification-original-label">
                                Message original
                              </Typography>
                              <Typography className="notification-original-content">
                                {notification.originalMessage}
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box className="notification-time-wrapper">
                          <Typography variant="caption" className="notification-time">
                            {formatDistanceToNow(notification.createdAt, { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </Typography>
                          <Chip
                            label={notification.read ? "Lu" : "Non lu"}
                            size="small"
                            className={`notification-status ${notification.read ? 'read' : 'unread'}`}
                          />
                        </Box>
                      }
                      disableTypography
                    />
                  </ListItem>

                  {index < notifications.length - 1 && (
                    <Divider className="notification-divider" variant="middle" />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;