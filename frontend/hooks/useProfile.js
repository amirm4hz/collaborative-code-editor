import { useState, useEffect } from 'react';

const PROFILE_KEY = 'collabcode_profile';
const ROOMS_KEY = 'collabcode_recent_rooms';
const MAX_RECENT_ROOMS = 10;

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [recentRooms, setRecentRooms] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load profile and recent rooms from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      const savedRooms = localStorage.getItem(ROOMS_KEY);

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedRooms) setRecentRooms(JSON.parse(savedRooms));
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save or update profile
  function saveProfile(name, color) {
    const newProfile = { name, color, createdAt: Date.now() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
    return newProfile;
  }

  // Add a room to recent history
  function addRecentRoom(room) {
    try {
      const existing = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');

      // Remove if already exists (we'll re-add at top)
      const filtered = existing.filter(r => r.id !== room.id);

      // Add to front with lastVisited timestamp
      const updated = [
        { ...room, lastVisited: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_ROOMS); // keep max 10

      localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
      setRecentRooms(updated);
    } catch (err) {
      console.error('Failed to save recent room:', err);
    }
  }

  // Remove a room from history
  function removeRecentRoom(roomId) {
    try {
      const existing = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');
      const updated = existing.filter(r => r.id !== roomId);
      localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
      setRecentRooms(updated);
    } catch (err) {
      console.error('Failed to remove recent room:', err);
    }
  }

  // Clear profile entirely
  function clearProfile() {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }

  return {
    profile,
    recentRooms,
    loaded,
    saveProfile,
    addRecentRoom,
    removeRecentRoom,
    clearProfile,
  };
}