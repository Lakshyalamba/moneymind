import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaUser, FaEnvelope, FaPhone, FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaChartLine, FaCalendarAlt, FaExchangeAlt, FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import '../styles/profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', bio: '', profilePhoto: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({ transactionCount: 0 });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, txRes] = await Promise.all([
          apiRequest(`${API_BASE_URL}/api/profile`),
          apiRequest(`${API_BASE_URL}/api/transactions?page=1&limit=1`)
        ]);

        if (!profileRes.ok) { navigate('/login'); return; }

        const profileData = await profileRes.json();
        setUser(profileData.user);
        setFormData({
          name: profileData.user.name || '',
          phone: profileData.user.phone || '',
          bio: profileData.user.bio || '',
          profilePhoto: profileData.user.profilePhoto || ''
        });

        if (txRes.ok) {
          const txData = await txRes.json();
          setStats({ transactionCount: txData.totalCount || 0 });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        navigate('/login');
      } finally {
        setPageLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    else if (formData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (formData.phone && !/^[+]?[\d\s\-()]{6,20}$/.test(formData.phone.trim())) {
      errs.phone = 'Enter a valid phone number';
    }
    if (formData.bio && formData.bio.length > 500) errs.bio = 'Bio must be under 500 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {};
      if (formData.name !== user.name) payload.name = formData.name.trim();
      if (formData.phone !== (user.phone || '')) payload.phone = formData.phone.trim() || null;
      if (formData.bio !== (user.bio || '')) payload.bio = formData.bio.trim() || null;
      if (formData.profilePhoto !== (user.profilePhoto || '')) payload.profilePhoto = formData.profilePhoto;

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await apiRequest(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
        bio: data.user.bio || '',
        profilePhoto: data.user.profilePhoto || ''
      });
      setPhotoPreview('');
      setIsEditing(false);
      showToast(data.message || 'Profile updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      profilePhoto: user.profilePhoto || ''
    });
    setPhotoPreview('');
    setErrors({});
    setIsEditing(false);
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const memberSince = user?.createdAt ? formatDate(user.createdAt) : null;

  if (pageLoading) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const photoSrc = photoPreview || user?.profilePhoto;

  return (
    <div className="profile-page-wrapper">
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="profile-header-card">
        <div className="profile-header-left">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initial">{getInitial(user?.name)}</div>
              )}
            </div>
            {isEditing && (
              <label className="profile-avatar-upload">
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                <FaCamera />
              </label>
            )}
          </div>
          <div className="profile-header-info">
            <h1>{user?.name || 'User'}</h1>
            <p className="profile-header-email"><FaEnvelope /> {user?.email}</p>
            {memberSince && (
              <p className="profile-header-since"><FaCalendarAlt /> Member since {memberSince}</p>
            )}
          </div>
        </div>
        {!isEditing && (
          <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <FaExchangeAlt className="profile-stat-icon" />
          <div>
            <span className="profile-stat-value">{stats.transactionCount}</span>
            <span className="profile-stat-label">Transactions</span>
          </div>
        </div>
        <div className="profile-stat-card">
          <FaUser className="profile-stat-icon" />
          <div>
            <span className="profile-stat-value">{user?.name ? user.name.split(' ')[0] : '—'}</span>
            <span className="profile-stat-label">Display Name</span>
          </div>
        </div>
        <div className="profile-stat-card">
          <FaChartLine className="profile-stat-icon" />
          <div>
            <span className="profile-stat-value">{user?.email ? user.email.split('@')[1] : '—'}</span>
            <span className="profile-stat-label">Email Domain</span>
          </div>
        </div>
      </div>

      <div className="profile-form-card">
        <div className="profile-form-header">
          <h2>{isEditing ? 'Edit Profile' : 'Account Details'}</h2>
          {!isEditing && (
            <p>Your personal information and contact details</p>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-details">
            <div className="profile-detail-row">
              <div className="profile-detail-label"><FaUser /> Name</div>
              <div className="profile-detail-value">{user?.name || 'Not set'}</div>
            </div>
            <div className="profile-detail-row">
              <div className="profile-detail-label"><FaEnvelope /> Email</div>
              <div className="profile-detail-value">{user?.email || 'Not set'}</div>
            </div>
            <div className="profile-detail-row">
              <div className="profile-detail-label"><FaPhone /> Phone</div>
              <div className="profile-detail-value">{user?.phone || 'Not set'}</div>
            </div>
            <div className="profile-detail-row profile-detail-row--bio">
              <div className="profile-detail-label"><FaInfoCircle /> Bio</div>
              <div className="profile-detail-value">{user?.bio || 'No bio yet'}</div>
            </div>
          </div>
        ) : (
          <div className="profile-form-fields">
            <div className="profile-field">
              <label><FaUser /> Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`profile-input ${errors.name ? 'profile-input--error' : ''}`}
                placeholder="Your full name"
                disabled={saving}
              />
              {errors.name && <span className="profile-field-error">{errors.name}</span>}
            </div>
            <div className="profile-field">
              <label><FaEnvelope /> Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="profile-input profile-input--disabled"
                disabled
              />
              <span className="profile-field-hint">Email cannot be changed</span>
            </div>
            <div className="profile-field">
              <label><FaPhone /> Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`profile-input ${errors.phone ? 'profile-input--error' : ''}`}
                placeholder="+1 (555) 000-0000"
                disabled={saving}
              />
              {errors.phone && <span className="profile-field-error">{errors.phone}</span>}
            </div>
            <div className="profile-field">
              <label><FaInfoCircle /> Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className={`profile-textarea ${errors.bio ? 'profile-input--error' : ''}`}
                placeholder="Tell us a little about yourself..."
                rows="4"
                disabled={saving}
              />
              <span className="profile-field-hint">{formData.bio.length}/500</span>
              {errors.bio && <span className="profile-field-error">{errors.bio}</span>}
            </div>
            <div className="profile-form-actions">
              <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><div className="profile-btn-spinner" /> Saving...</>
                ) : (
                  <><FaSave /> Save Changes</>
                )}
              </button>
              <button className="profile-cancel-btn" onClick={handleCancel} disabled={saving}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
