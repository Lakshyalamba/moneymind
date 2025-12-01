import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css';

function Profile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profilePhoto: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://moneymind-1-1jg4.onrender.com/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData(data.user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login');
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
          profilePhoto: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://moneymind-1-1jg4.onrender.com/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setUser(formData);
        setIsEditing(false);
        setPhotoPreview('');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
    setPhotoPreview('');
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
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
              {photoPreview || user.profilePhoto ? (
                <img
                  src={photoPreview || user.profilePhoto}
                  alt="Profile"
                  className="profile-photo"
                />
              ) : (
                <div className="profile-initial">
                  {getInitial(user.name)}
                </div>
              )}
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
                <label>Name</label>
                <p>{user.name || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{user.email || 'Not provided'}</p>
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
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
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