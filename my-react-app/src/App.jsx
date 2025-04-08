import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set, get, child } from 'firebase/database';

export default function DnDHealthTracker() {
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [characters, setCharacters] = useState([]);
  const [maxHP, setMaxHP] = useState(0);
  const [currentHP, setCurrentHP] = useState(0);
  const [characterName, setCharacterName] = useState('');

  // Load data when component mounts
  useEffect(() => {
    // Check if user has session data
    const savedRoom = sessionStorage.getItem('dnd-room-code');
    if (savedRoom) {
      setRoomCode(savedRoom);
      
      const savedUsername = sessionStorage.getItem('dnd-username');
      const savedIsDM = sessionStorage.getItem('dnd-is-dm') === 'true';
      
      if (savedUsername) {
        setUsername(savedUsername);
        setIsDM(savedIsDM);
        setView(savedIsDM ? 'dm' : 'player');
        
        // If player, load their character data
        if (!savedIsDM) {
          // Get player data from Firebase
          const playerRef = ref(database, `rooms/${savedRoom}/players/${savedUsername}`);
          get(playerRef).then((snapshot) => {
            if (snapshot.exists()) {
              const playerData = snapshot.val();
              setCharacterName(playerData.name || '');
              setMaxHP(playerData.maxHP || 0);
              setCurrentHP(playerData.currentHP || 0);
            }
          });
        }
      }
    }
  }, []);

  // Set up real-time listener for character data when in a room
  useEffect(() => {
    if (!roomCode || view === 'login') return;
    
    const roomRef = ref(database, `rooms/${roomCode}/players`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const allCharacters = Object.keys(playersData).map(key => ({
          ...playersData[key],
          playerName: key
        })).filter(char => char.name); // Only include players with character names
        
        setCharacters(allCharacters);
      } else {
        setCharacters([]);
      }
    });
    
    // Cleanup listener on unmount or room change
    return () => unsubscribe();
  }, [roomCode, view]);

  const handleLogin = () => {
    if (!username || !roomCode) return;
    
    // Save to session storage for page refreshes
    sessionStorage.setItem('dnd-username', username);
    sessionStorage.setItem('dnd-is-dm', isDM.toString());
    sessionStorage.setItem('dnd-room-code', roomCode);
    
    setView(isDM ? 'dm' : 'player');
    
    if (!isDM) {
      // Initialize player if needed
      const playerRef = ref(database, `rooms/${roomCode}/players/${username}`);
      get(playerRef).then((snapshot) => {
        if (snapshot.exists()) {
          const playerData = snapshot.val();
          setCharacterName(playerData.name || '');
          setMaxHP(playerData.maxHP || 0);
          setCurrentHP(playerData.currentHP || 0);
        } else {
          // Create new player data
          const initialData = { name: '', maxHP: 0, currentHP: 0 };
          set(playerRef, initialData);
        }
      });
    }
  };

  const savePlayerData = () => {
    const playerRef = ref(database, `rooms/${roomCode}/players/${username}`);
    const playerData = {
      name: characterName,
      maxHP: maxHP,
      currentHP: currentHP
    };
    set(playerRef, playerData);
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('dnd-room-code');
    sessionStorage.removeItem('dnd-username');
    sessionStorage.removeItem('dnd-is-dm');
    
    // Reset state
    setView('login');
    setIsDM(false);
    setCharacterName('');
    setMaxHP(0);
    setCurrentHP(0);
    setRoomCode('');
    setUsername('');
  };

  const adjustHealth = (playerName, amount) => {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerName}`);
    
    get(playerRef).then((snapshot) => {
      if (snapshot.exists()) {
        const playerData = snapshot.val();
        playerData.currentHP = Math.min(Math.max(0, playerData.currentHP + amount), playerData.maxHP);
        set(playerRef, playerData);
      }
    });
  };

  const getHealthColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage > 75) return "text-green-600";
    if (percentage > 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-800">D&D Health Tracker</h1>
        
        {view === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Room Code</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter a room code"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your name"
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="dm-checkbox"
                checked={isDM}
                onChange={(e) => setIsDM(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="dm-checkbox" className="text-gray-700">I am the DM</label>
            </div>
            
            <button 
              onClick={handleLogin}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Enter Game
            </button>
          </div>
        )}
        
        {view === 'dm' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">DM View - Room: {roomCode}</h2>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Players: {characters.length}</p>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                >
                  Change Room
                </button>
              </div>
            </div>
            
            {characters.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No players have joined this room yet.
                <p className="mt-2">Share the room code '{roomCode}' with your players!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Character</th>
                      <th className="py-2 px-4 text-left">Player</th>
                      <th className="py-2 px-4 text-center">Health</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {characters.map((character, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-3 px-4 font-medium">{character.name || "Unnamed"}</td>
                        <td className="py-3 px-4 text-gray-600">{character.playerName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={getHealthColor(character.currentHP, character.maxHP)}>
                            {character.currentHP}/{character.maxHP}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => adjustHealth(character.playerName, 5)}
                            className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
                          >
                            Heal
                          </button>
                          <button
                            onClick={() => adjustHealth(character.playerName, -5)}
                            className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 ml-2"
                          >
                            Damage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {view === 'player' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Player View</h2>
              <p className="text-gray-700 mb-2">Character: {characterName || "Unnamed"}</p>
              <div className="flex items-center mb-4">
                <div className="text-sm text-gray-600">Max HP: {maxHP}</div>
                <div className="text-sm text-gray-600 ml-4">Current HP: {currentHP}</div>
              </div>
              <button
                onClick={savePlayerData}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
