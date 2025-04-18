import { useState, useEffect } from 'react';

export default function DnDHealthTracker() {
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [characters, setCharacters] = useState([]);
  const [maxHP, setMaxHP] = useState(0);
  const [currentHP, setCurrentHP] = useState(0);
  const [characterName, setCharacterName] = useState('');

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedRoom = localStorage.getItem('dnd-room-code');
    if (savedRoom) {
      setRoomCode(savedRoom);
      
      const savedUsername = localStorage.getItem('dnd-username');
      const savedIsDM = localStorage.getItem('dnd-is-dm') === 'true';
      
      if (savedUsername) {
        setUsername(savedUsername);
        setIsDM(savedIsDM);
        setView(savedIsDM ? 'dm' : 'player');
        
        // If player, load their character data
        if (!savedIsDM) {
          const playerData = JSON.parse(localStorage.getItem(`dnd-player-${savedRoom}-${savedUsername}`) || '{}');
          if (playerData.name) {
            setCharacterName(playerData.name);
            setMaxHP(playerData.maxHP || 0);
            setCurrentHP(playerData.currentHP || 0);
          }
        }
      }
    }
    
    // Setup interval to check for updates
    const interval = setInterval(() => {
      if (roomCode && view !== 'login') {
        updateCharacterList();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roomCode, view]);

  const updateCharacterList = () => {
    const allCharacters = [];
    
    // Scan localStorage for all players in this room
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`dnd-player-${roomCode}-`)) {
        try {
          const playerData = JSON.parse(localStorage.getItem(key) || '{}');
          if (playerData.name) {
            allCharacters.push(playerData);
          }
        } catch (e) {
          console.error("Error parsing player data", e);
        }
      }
    }
    
    setCharacters(allCharacters);
  };

  const handleLogin = () => {
    if (!username || !roomCode) return;
    
    localStorage.setItem('dnd-username', username);
    localStorage.setItem('dnd-is-dm', isDM.toString());
    localStorage.setItem('dnd-room-code', roomCode);
    
    setView(isDM ? 'dm' : 'player');
    
    if (!isDM) {
      // Initialize player if needed
      const key = `dnd-player-${roomCode}-${username}`;
      const existingData = localStorage.getItem(key);
      if (!existingData) {
        const initialData = { name: '', maxHP: 0, currentHP: 0, playerName: username };
        localStorage.setItem(key, JSON.stringify(initialData));
      } else {
        const playerData = JSON.parse(existingData);
        setCharacterName(playerData.name || '');
        setMaxHP(playerData.maxHP || 0);
        setCurrentHP(playerData.currentHP || 0);
      }
    } else {
      updateCharacterList();
    }
  };

  const savePlayerData = () => {
    const key = `dnd-player-${roomCode}-${username}`;
    const playerData = {
      name: characterName,
      maxHP: maxHP,
      currentHP: currentHP,
      playerName: username
    };
    localStorage.setItem(key, JSON.stringify(playerData));
  };

  const handleLogout = () => {
    // Clear the room code from localStorage
    localStorage.removeItem('dnd-room-code');
    localStorage.removeItem('dnd-username');
    localStorage.removeItem('dnd-is-dm');
    
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
    const key = `dnd-player-${roomCode}-${playerName}`;
    try {
      const playerData = JSON.parse(localStorage.getItem(key) || '{}');
      playerData.currentHP = Math.min(Math.max(0, playerData.currentHP + amount), playerData.maxHP);
      localStorage.setItem(key, JSON.stringify(playerData));
      updateCharacterList();
    } catch (e) {
      console.error("Error adjusting health", e);
    }
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
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            <span className={`font-bold ${getHealthColor(character.currentHP, character.maxHP)}`}>
                              {character.currentHP}
                            </span>
                            <span className="mx-1">/</span>
                            <span>{character.maxHP}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                character.currentHP / character.maxHP > 0.5 ? 'bg-green-500' : 
                                character.currentHP / character.maxHP > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{width: `${Math.max(0, Math.min(100, (character.currentHP / character.maxHP) * 100))}%`}}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={() => adjustHealth(character.playerName, -1)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 w-8 h-8 rounded-full"
                            >
                              -
                            </button>
                            <button 
                              onClick={() => adjustHealth(character.playerName, 1)}
                              className="bg-green-100 hover:bg-green-200 text-green-700 w-8 h-8 rounded-full"
                            >
                              +
                            </button>
                          </div>
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
              <h2 className="text-xl font-semibold mb-2">Player View - Room: {roomCode}</h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Player: {username}</p>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                >
                  Change Room
                </button>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Character Name</label>
                <input 
                  type="text" 
                  value={characterName}
                  onChange={(e) => {
                    setCharacterName(e.target.value);
                  }}
                  onBlur={savePlayerData}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter character name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Max HP</label>
                  <input 
                    type="number" 
                      value={maxHP}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    setMaxHP(isNaN(value) ? 0 : value);
  }}
  onBlur={savePlayerData}
  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
  min="1"
/>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Current HP</label>
                  <input 
  type="number" 
  value={currentHP}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    setCurrentHP(isNaN(value) ? 0 : Math.min(maxHP, Math.max(0, value)));
  }}
  onBlur={savePlayerData}
  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
  min="0"
  max={maxHP}
/>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Health Adjustment</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setCurrentHP(Math.max(0, currentHP - 5));
                      savePlayerData();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full"
                  >
                    -5
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentHP(Math.max(0, currentHP - 1));
                      savePlayerData();
                    }}
                    className="bg-red-400 hover:bg-red-500 text-white w-10 h-10 rounded-full"
                  >
                    -1
                  </button>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getHealthColor(currentHP, maxHP)}`}>
                    {currentHP} / {maxHP}
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-3 mt-1">
                    <div 
                      className={`h-3 rounded-full ${
                        currentHP / maxHP > 0.5 ? 'bg-green-500' : 
                        currentHP / maxHP > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{width: `${Math.max(0, Math.min(100, (currentHP / maxHP) * 100))}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setCurrentHP(Math.min(maxHP, currentHP + 1));
                      savePlayerData();
                    }}
                    className="bg-green-400 hover:bg-green-500 text-white w-10 h-10 rounded-full"
                  >
                    +1
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentHP(Math.min(maxHP, currentHP + 5));
                      savePlayerData();
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}