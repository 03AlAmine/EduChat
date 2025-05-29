import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import Chat from "../components/Chat";
import { useAuth } from "../components/auth/AuthContext";

const GroupChatPage = () => {
  const { groupSlug } = useParams();
  const { currentUser } = useAuth();

  const [group, setGroup] = useState(null);
  const [, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroupBySlug = async () => {
      if (!groupSlug) return;

      setLoading(true);
      try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("slug", "==", groupSlug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const groupData = querySnapshot.docs[0].data();
          setGroup({ id: querySnapshot.docs[0].id, ...groupData });
        } else {
          setError("Groupe introuvable.");
        }
      } catch (err) {
        setError("Erreur lors du chargement du groupe.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBySlug();
  }, [groupSlug]);

  if (!currentUser) return <p>Chargement utilisateur...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <Chat groupId={group?.id} name={currentUser.displayName || currentUser.email || "Utilisateur"} />
    </div>
  );
};

export default GroupChatPage;
