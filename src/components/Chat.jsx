import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  increment,
  writeBatch,

} from 'firebase/firestore';
import styles from './Chat.module.css';
import { Avatar, Button, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import * as vader from 'vader-sentiment';

class FrenchSentimentAnalyzer {
  constructor() {
    this.lexicon = {
      // Mots positifs
      'super': 3.5, 'génial': 4.0, 'excellent': 4.2, 'parfait': 4.1,
      'content': 3.3, 'heureux': 3.7, 'bon': 2.5, 'bien': 2.0,
      'adorable': 3.8, 'magnifique': 3.9, 'merveilleux': 3.6,
      'cool': 2.8, 'sympa': 2.7, 'top': 3.0,

      // Mots négatifs
      'pas': -1.0, 'non': -1.2, 'jamais': -1.5, 'rien': -1.3,
      'déteste': -4.0, 'haine': -4.3, 'mauvais': -2.5, 'mal': -2.0,
      'terrible': -3.8, 'horrible': -3.9, 'nul': -3.0, 'pourri': -3.2,
      'déçu': -2.8, 'triste': -2.5, 'guerre': -4.0,

      // Wolof de base
      'baax': 3.5, 'rafet': 3.8, 'neex': 3.6, 'teranga': 4.2,
      'bonn': -3.5, 'xiif': -3.2, 'yagg': -2.8, 'tàng': -3.6,
      'jamm': 3.7, 'sant': 3.0
    };

    this.negations = ['pas', 'non', 'jamais', 'rien', 'aucun', 'sans', 'ni'];
    this.intensifiers = {
      'très': 1.3, 'vraiment': 1.4, 'trop': 1.2, 'extrêmement': 1.5,
      'complètement': 1.4, 'absolument': 1.3, 'lool': 1.4,
      'hyper': 1.3, 'tellement': 1.2, 'grave': 1.1
    };
  }

  analyze(text) {
    if (!text || typeof text !== 'string') return 'neutre';

    const words = text.toLowerCase().match(/\b[\w+]+\b/g) || [];
    let score = 0;
    let wordCount = 0;
    let negation = false;
    let intensity = 1;

    words.forEach((word, index) => {
      // Vérifie les négations
      if (this.negations.includes(word)) {
        negation = true;
        return;
      }

      // Vérifie les intensificateurs
      if (this.intensifiers[word]) {
        intensity *= this.intensifiers[word];
        return;
      }

      // Vérifie le lexique
      if (this.lexicon[word]) {
        let wordScore = this.lexicon[word];

        // Applique la négation si nécessaire
        if (negation) {
          wordScore *= -0.7;
          negation = false;
        }

        score += wordScore;
        wordCount++;
      }
    });

    // Score moyen si des mots trouvés
    if (wordCount > 0) {
      score = (score / wordCount) * intensity;
    } else {
      // Analyse basique pour texte sans mots du lexique
      if (text.length > 30) return 'neutre';
      if (/(!{2,}|[A-Z]{3,})/.test(text)) return 'positif';
      if (/\.{3,}/.test(text)) return 'négatif';
      return 'neutre';
    }

    // Détermine le sentiment final
    if (score >= 0.5) return 'positif';
    if (score <= -0.5) return 'négatif';
    return 'neutre';
  }
}

const Chat = ({ groupId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const analyzer = useRef(new FrenchSentimentAnalyzer()).current;

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages]);

  useEffect(() => {
    if (!groupId) return;

    const fetchGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          setGroup({ id: groupDoc.id, ...groupDoc.data() });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchGroup();
  }, [groupId]);

  const analyzeSentiment = (text) => {
    // Analyse avec VADER
    const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const vaderCompound = vaderResult.compound;

    // Analyse avec notre analyseur français
    const frenchResult = analyzer.analyze(text);
    const frenchScore = frenchResult === 'positif' ? 1 : frenchResult === 'négatif' ? -1 : 0;

    // Combinaison des résultats (poids 60% VADER, 40% analyseur français)
    const combinedScore = (vaderCompound * 0.6) + (frenchScore * 0.4);

    // Détermination du sentiment final
    if (combinedScore >= 0.05) return 'positif';
    if (combinedScore <= -0.05) return 'négatif';
    return 'neutre';
  };

  // Dans le composant Chat, modifiez la fonction handleSendMessage
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserData) return;

    const messageToSend = newMessage;
    setNewMessage('');

    const sentiment = analyzeSentiment(messageToSend);

    try {
      // Utilisez une transaction batch pour les opérations atomiques
      const batch = writeBatch(db);

      // Ajouter le message
      const messageRef = doc(collection(db, 'groups', groupId, 'messages'));
      batch.set(messageRef, {
        text: messageToSend,
        senderId: auth.currentUser?.uid,
        senderUsername: currentUserData.username,
        createdAt: Timestamp.now(),
        sentimentType: sentiment,
      });

      // Mettre à jour le compteur de messages
      const groupRef = doc(db, 'groups', groupId);
      batch.update(groupRef, {
        messagesTotal: increment(1)
      });

      await batch.commit();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      setNewMessage(messageToSend);
    }
  };
  const handleGoBack = () => {
    navigate('/');
  };

  const handleLeaveGroup = async () => {
    if (!auth.currentUser) return;

    try {
      const userGroupRef = doc(db, 'userGroups', `${auth.currentUser.uid}_${groupId}`);
      await deleteDoc(userGroupRef);
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la sortie du groupe :', error);
    }
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleScrollButtonClick = () => {
    scrollToBottom();
  };

  const formatDateLabel = (date) => {
    const today = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = (now - d) / (1000 * 60 * 60 * 24);

    if (diff === 0) return 'Aujourd\'hui';
    if (diff === 1) return 'Hier';
    if (diff === 2) return 'Avant-hier';
    return `${date.getDate().toString().padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const groupMessagesByDate = (messages) => {
    const grouped = {};
    messages.forEach(msg => {
      const date = msg.createdAt?.toDate();
      if (!date) return;
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <IconButton onClick={handleGoBack} className={styles.backButton}>
            <ArrowBackIcon />
          </IconButton>
          <h2 className={styles.groupTitle}>Groupe : {group?.name || '...'}</h2>
        </div>
        <div className={styles.userInfo}>
          <span>{currentUserData?.username || 'Utilisateur'}</span>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLeaveGroup}
        >
          Quitter le groupe
        </Button>
      </div>

      <div className={styles.messagesList} ref={messagesContainerRef}>
        {Object.keys(groupedMessages).map(dateKey => {
          const date = new Date(dateKey);
          const label = formatDateLabel(date);
          return (
            <div key={dateKey}>
              <div className={styles.dateLabel}>{label}</div>
              {groupedMessages[dateKey].map(msg => {
                const isCurrentUser = msg.senderId === auth.currentUser?.uid;
                const displayUsername = isCurrentUser ? 'Vous' : msg.senderUsername || 'Anonyme';
                const avatarLetter = displayUsername.charAt(0).toUpperCase();

                let sentimentEmoji = '😐'; // Default neutral
                if (msg.sentimentType === 'positif') sentimentEmoji = '😊';
                else if (msg.sentimentType === 'négatif') sentimentEmoji = '⚠️';

                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageItem} ${isCurrentUser ? styles.currentUser : styles.otherUser}`}
                  >
                    {!isCurrentUser && (
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {avatarLetter}
                      </Avatar>
                    )}
                    <div className={styles.messageContent}>
                      {!isCurrentUser && (
                        <span className={styles.senderName}>{displayUsername}</span>
                      )}
                      <div className={styles.messageBubble}>
                        {msg.text} {/*<span title={`Sentiment: ${msg.sentimentType}`}>{sentimentEmoji}</span>*/}
                        <div className={styles.messageTime}>
                          {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showScrollButton && (
        <IconButton
          onClick={handleScrollButtonClick}
          className={styles.scrollToBottomButton}
          color="primary"
          aria-label="Descendre jusqu'en bas"
          size="large"
        >
          <ArrowDownwardIcon />
        </IconButton>
      )}

      <div className={styles.inputArea}>
        <TextField
          className={styles.messageInput}
          fullWidth
          variant="standard"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          className={styles.sendButton}
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </Button>
      </div>
    </div>
  );
};

export default Chat;