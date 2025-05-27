import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import { storage, db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import './UserProfile.css';

const UserProfile = () => {
  const { currentUser, userData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: currentUser?.email || '',
    description: userData?.description || '',
    phone: userData?.phone || '',
    location: userData?.location || '',
    birthdate: userData?.birthdate || '',
    linkedin: userData?.linkedin || '',
    github: userData?.github || '',
    avatarUrl: userData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentUser) return;
    const file = e.target.files[0];
    const storageRef = ref(storage, `avatars/${currentUser.uid}`);
    setUploading(true);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, avatarUrl: downloadURL }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }

    setUploading(false);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), formData);
      setEditing(false);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <div className="profile-glass">
      <div className="profile-header">
        <div className="avatar-hover-container">
          <div className="avatar-glow">
            <img 
              src={formData.avatarUrl} 
              alt="Profile" 
              className={`profile-avatar ${editing ? 'editable' : ''}`}
            />
          </div>
          {editing && (
            <div className="avatar-upload-container">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <span className="upload-button">
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="profile-titles">
          <h1 className="profile-name">{formData.name}</h1>
          <p className="profile-title">{formData.description || 'No description yet'}</p>
        </div>
      </div>

      <div className="profile-grid">
        <ProfileSection title="Personal Information" icon="👤">
          <ProfileField 
            label="Full Name" 
            name="name"
            value={formData.name}
            editing={editing}
            onChange={handleChange}
          />
          <ProfileField 
            label="Email" 
            name="email"
            value={formData.email}
            editing={editing}
            onChange={handleChange}
            type="email"
          />
          <ProfileField 
            label="Phone" 
            name="phone"
            value={formData.phone}
            editing={editing}
            onChange={handleChange}
            type="tel"
          />
        </ProfileSection>

        <ProfileSection title="Location Details" icon="📍">
          <ProfileField 
            label="Location" 
            name="location"
            value={formData.location}
            editing={editing}
            onChange={handleChange}
          />
          <ProfileField 
            label="Birthdate" 
            name="birthdate"
            value={formData.birthdate}
            editing={editing}
            onChange={handleChange}
            type="date"
          />
        </ProfileSection>

        <ProfileSection title="About Me" icon="📝">
          <div className="about-field">
            {editing ? (
              <textarea
                name="description"
                className="profile-textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell something about yourself..."
              />
            ) : (
              <p className="profile-bio">
                {formData.description || 'No description provided yet.'}
              </p>
            )}
          </div>
        </ProfileSection>

        <ProfileSection title="Social Links" icon="🔗">
          <ProfileField 
            label="LinkedIn" 
            name="linkedin"
            value={formData.linkedin}
            editing={editing}
            onChange={handleChange}
            type="url"
            linkable
          />
          <ProfileField 
            label="GitHub" 
            name="github"
            value={formData.github}
            editing={editing}
            onChange={handleChange}
            type="url"
            linkable
          />
        </ProfileSection>
      </div>

      <div className="profile-actions">
        {editing ? (
          <div className="action-buttons">
            <button 
              className="button cancel-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button 
              className="button save-button"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        ) : (
          <button 
            className="button edit-button"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

const ProfileSection = ({ 
  title, 
  icon,
  children 
}: { 
  title: string; 
  icon?: string;
  children: React.ReactNode 
}) => (
  <div className="profile-section">
    <div className="section-header">
      {icon && <span className="section-icon">{icon}</span>}
      <h3 className="section-title">{title}</h3>
    </div>
    <div className="section-content">
      {children}
    </div>
  </div>
);

const ProfileField = ({
  label,
  name,
  value,
  editing,
  onChange,
  type = 'text',
  linkable = false
}: {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  linkable?: boolean;
}) => (
  <div className="profile-field">
    <label className="field-label">{label}</label>
    {editing ? (
      <input
        type={type}
        name={name}
        className="field-input"
        value={value}
        onChange={onChange}
        placeholder={label}
      />
    ) : (
      <div className="field-value">
        {linkable && value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-link"
          >
            {value}
          </a>
        ) : value || <span className="empty-value">Not specified</span>}
      </div>
    )}
  </div>
);

export default UserProfile;