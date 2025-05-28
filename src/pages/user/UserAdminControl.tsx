import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  Stack,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Divider from "@mui/material/Divider";
import "./UserAdmin.css";

interface User {
  id: string;
  firstName: string;
  username: string;
  email: string;
  createdAt: Date;
  groups: {
    id: string;
    name: string;
  }[];
}

const UserAdminControl: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userGroupsQuery = query(
          collection(db, "userGroups"),
          where("userId", "==", userDoc.id)
        );

        const userGroupsSnapshot = await getDocs(userGroupsQuery);
        const groupIds = userGroupsSnapshot.docs.map(
          (doc) => doc.data().groupId
        );

        const groups = [];
        for (const groupId of groupIds) {
          const groupDoc = await getDocs(
            query(collection(db, "groups"), where("__name__", "==", groupId))
          );

          if (!groupDoc.empty) {
            groups.push({
              id: groupId,
              name: groupDoc.docs[0].data().name,
            });
          }
        }

        usersData.push({
          id: userDoc.id,
          firstName: userDoc.data().name || "Non renseigné",
          username: userDoc.data().username || "Aucun pseudo",
          email: userDoc.data().email,
          createdAt: userDoc.data().createdAt?.toDate() || new Date(),
          groups,
        });
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        await deleteDoc(doc(db, "users", userId));

        const userGroupsQuery = query(
          collection(db, "userGroups"),
          where("userId", "==", userId)
        );

        const userGroupsSnapshot = await getDocs(userGroupsQuery);
        const deletePromises = userGroupsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );

        await Promise.all(deletePromises);
        fetchUsers();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };
  const removeUserFromGroup = async (userId: string, groupId: string) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir retirer cet utilisateur du groupe?"
      )
    ) {
      try {
        // Trouver le document userGroup correspondant
        const userGroupsQuery = query(
          collection(db, "userGroups"),
          where("userId", "==", userId),
          where("groupId", "==", groupId)
        );

        const userGroupsSnapshot = await getDocs(userGroupsQuery);

        // Supprimer tous les documents trouvés (normalement il ne devrait y en avoir qu'un)
        const deletePromises = userGroupsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);

        // Mettre à jour l'état local
        setSelectedUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            groups: prev.groups.filter((group) => group.id !== groupId),
          };
        });

        // Rafraîchir la liste des utilisateurs
        fetchUsers();
      } catch (error) {
        console.error("Erreur lors du retrait du groupe:", error);
      }
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <PersonIcon
          sx={{
            fontSize: 40,
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light,
            p: 1,
            borderRadius: "50%",
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: theme.palette.text.primary,
          }}
        >
          Gestion des Utilisateurs
        </Typography>
      </Stack>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Rechercher un utilisateur..."
            InputProps={{
              startAdornment: (
                <SearchIcon
                  color="action"
                  sx={{ mr: 1, color: theme.palette.text.secondary }}
                />
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                width: 320,
              },
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              py: 1,
            }}
          >
            Actualiser
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? theme.palette.grey[50]
                        : theme.palette.grey[900],
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Utilisateur
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Date d'inscription
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Groupes
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        "&:last-child td": { borderBottom: 0 },
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              width: 40,
                              height: 40,
                              bgcolor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText,
                            }}
                          >
                            {user.firstName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="medium">
                              {user.firstName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @_{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <EmailIcon
                            sx={{
                              mr: 1,
                              color: theme.palette.text.secondary,
                              fontSize: 18,
                            }}
                          />
                          {user.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <DateIcon
                            sx={{
                              mr: 1,
                              color: theme.palette.text.secondary,
                              fontSize: 18,
                            }}
                          />
                          {format(user.createdAt, "PPpp")}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {user.groups.length > 0 ? (
                            user.groups.map((group) => (
                              <Chip
                                key={group.id}
                                label={group.name}
                                size="small"
                                icon={<GroupIcon fontSize="small" />}
                                sx={{
                                  maxWidth: 150,
                                  borderRadius: 1,
                                  backgroundColor:
                                    theme.palette.action.selected,
                                  "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                  },
                                }}
                                onClick={() =>
                                  navigate(`/admin/group/${group.id}`)
                                }
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Aucun groupe
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Voir détails" arrow>
                            <IconButton
                              onClick={() => handleViewDetails(user)}
                              sx={{
                                color: theme.palette.info.main,
                                "&:hover": {
                                  backgroundColor: theme.palette.info.light,
                                },
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer" arrow>
                            <IconButton
                              onClick={() => handleDeleteUser(user.id)}
                              sx={{
                                color: theme.palette.error.main,
                                "&:hover": {
                                  backgroundColor: theme.palette.error.light,
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{
                        textAlign: "center",
                        p: 6,
                        borderBottom: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <SearchIcon
                          sx={{
                            fontSize: 60,
                            color: theme.palette.text.disabled,
                          }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          Aucun utilisateur trouvé
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Essayez de modifier vos critères de recherche
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog pour les détails de l'utilisateur */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                py: 2,
                px: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <PersonIcon sx={{ fontSize: 30 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {selectedUser.firstName}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      color: theme.palette.text.primary,
                    }}
                  >
                    <InfoIcon
                      sx={{ mr: 1, color: theme.palette.primary.main }}
                    />
                    Informations personnelles
                  </Typography>
                  <Box sx={{ pl: 3 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Pseudo
                        </Typography>
                        <Typography>@_{selectedUser.username}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography>{selectedUser.email}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date d'inscription
                        </Typography>
                        <Typography>
                          {format(selectedUser.createdAt, "PPpp")}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      color: theme.palette.text.primary,
                    }}
                  >
                    <GroupIcon
                      sx={{ mr: 1, color: theme.palette.primary.main }}
                    />
                    Groupes ({selectedUser.groups.length})
                  </Typography>
                  {selectedUser.groups.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        pl: 3,
                      }}
                    >
                      {selectedUser.groups.map((group) => (
                        <Box
                          key={group.id}
                          sx={{
                            position: "relative",
                            "&:hover .group-actions": {
                              opacity: 1,
                            },
                          }}
                        >
                          <Chip
                            label={group.name}
                            color="primary"
                            variant="outlined"
                            onClick={() => {
                              navigate(`/admin/group/${group.id}`);
                              setOpenDialog(false);
                            }}
                            sx={{
                              cursor: "pointer",
                              borderRadius: 1,
                              pr: 4, // Espace pour le bouton
                              "&:hover": {
                                backgroundColor: theme.palette.primary.light,
                              },
                            }}
                          />
                          <Tooltip title="Retirer du groupe" arrow>
                            <IconButton
                              size="small"
                              className="group-actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUserFromGroup(selectedUser.id, group.id);
                              }}
                              sx={{
                                position: "absolute",
                                right: 4,
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0,
                                transition: "opacity 0.2s",
                                color: theme.palette.error.main,
                                "&:hover": {
                                  backgroundColor: theme.palette.error.light,
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        pl: 3,
                        fontStyle: "italic",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Cet utilisateur n'a rejoint aucun groupe
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Button
                onClick={() => setOpenDialog(false)}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3,
                }}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserAdminControl;
