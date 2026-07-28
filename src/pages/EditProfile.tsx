import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProfile, updatePassword } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName !== user?.fullName || avatarFile) {
      await updateProfile.mutateAsync({ fullName, avatar: avatarFile });
    }
    if (password) {
      await updatePassword.mutateAsync(password);
    }
    navigate('/profile');
  };

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 className="section-title">Edit Profile</h1>
      
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div 
            style={{
              width: 100, height: 100, borderRadius: 32,
              background: 'linear-gradient(135deg, #0E7490, #F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 800, color: 'white',
              position: 'relative', cursor: 'pointer',
              border: '4px solid #F8FAFC', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: 28, objectFit: 'cover' }} />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? 'T'
            )}
            <div style={{
              position: 'absolute', bottom: -4, right: -4, background: '#0E7490',
              color: 'white', borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #F8FAFC'
            }}>
              <Camera size={16} />
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Tap to change picture</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginLeft: 4 }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Yash Jaiswal"
              className="input-base"
              style={{ fontSize: 16 }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginLeft: 4 }}>New Password (Optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="input-base"
              style={{ fontSize: 16 }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          disabled={updateProfile.isPending || updatePassword.isPending}
          style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48 }}
        >
          {(updateProfile.isPending || updatePassword.isPending) ? (
            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
