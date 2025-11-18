import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/profile.css';

function Profile() {
  const [user, setUser] = useState({
    profilePhoto: '',
    username: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3333/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData({
          ...formData,
          profilePhoto: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.put('http://localhost:3333/api/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(formData);
      setIsEditing(false);
      setPhotoPreview('');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
    setPhotoPreview('');
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="photo-container">
              <img
                src={photoPreview || user.profilePhoto || '/default-avatar.png'}
                alt="Profile"
                className="profile-photo"
              />
              {isEditing && (
                <label className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    hidden
                  />
                  <span className="upload-icon">📷</span>
                </label>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-info">
              <div className="info-item">
                <label>Username</label>
                <p>{user.username}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>{user.phone || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Bio</label>
                <p>{user.bio || 'No bio available'}</p>
              </div>
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;