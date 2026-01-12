import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Settings() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm();

  const handleUpdateProfile = async (data) => {
    setLoading(true);
    try {
      await authAPI.updateProfile(data);
      toast.success('Profile updated successfully');
      checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data) => {
    setPasswordLoading(true);
    try {
      await authAPI.changePassword(data);
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              className={`input ${profileForm.formState.errors.username ? 'border-red-500' : ''}`}
              {...profileForm.register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
            />
            {profileForm.formState.errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {profileForm.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className={`input ${profileForm.formState.errors.email ? 'border-red-500' : ''}`}
              {...profileForm.register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {profileForm.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {profileForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className={`input ${passwordForm.formState.errors.currentPassword ? 'border-red-500' : ''}`}
              {...passwordForm.register('currentPassword', {
                required: 'Current password is required',
              })}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className={`input ${passwordForm.formState.errors.newPassword ? 'border-red-500' : ''}`}
              {...passwordForm.register('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /\d/,
                  message: 'Password must contain at least one number',
                },
              })}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className={`input ${passwordForm.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
              {...passwordForm.register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === passwordForm.watch('newPassword') || 'Passwords do not match',
              })}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={passwordLoading} className="btn btn-primary">
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Account Status</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member Since</span>
            <span className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          {user?.lastLogin && (
            <div className="flex justify-between">
              <span className="text-gray-500">Last Login</span>
              <span className="font-medium">
                {new Date(user.lastLogin).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
