import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const [username, setUsername] = useState('');
  // NEW: State to track the selected room
  const [room, setRoom] = useState('General');
  const [hasJoined, setHasJoined] = useState(false);
  
  const [message, setMessage] = useState('');
  const [chatList, setChatList] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_message', (data) => {
      setChatList((prev) => [...prev, data]);
    });

    socket.on('user_typing', (name) => setTypingUser(name));
    socket.on('user_stopped_typing', () => setTypingUser(null));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() !== '') {
      // NEW: Tell the server which room to join
      socket.emit('join_room', room);
      setHasJoined(true);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    // NEW: Send both the username AND the room to the server
    socket.emit('typing', { username, room }); 

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', room);
    }, 1000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      // NEW: Include the room when sending the message
      socket.emit('send_message', { 
        text: message, 
        senderId: socket.id,
        senderName: username,
        room: room 
      });
      setMessage('');
      
      socket.emit('stop_typing', room);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  if (!hasJoined) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ lineHeight: '1.4', marginBottom: '25px' }}>Welcome to Chat App</h1>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Enter your name..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          {/* NEW: Room Selection Dropdown */}
          <select 
            value={room} 
            onChange={(e) => setRoom(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
          >
            <option value="General">General</option>
            <option value="Tech">Tech</option>
            <option value="Gaming">Gaming</option>
          </select>
          <button type="submit" style={{ padding: '10px', background: '#0084ff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            Join Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>{room} Room</h1>
      <p style={{ textAlign: 'center', fontSize: '14px', color: 'gray' }}>
        Logged in as: <strong>{username}</strong>
      </p>

      <div style={{ height: '300px', border: '1px solid #ccc', padding: '10px', overflowY: 'auto', marginBottom: '5px', borderRadius: '5px' }}>
        {chatList.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.senderId === socket.id ? 'right' : 'left', margin: '10px 0' }}>
            {msg.senderId !== socket.id && (
              <div style={{ fontSize: '12px', color: 'gray', marginBottom: '2px', marginLeft: '5px' }}>
                {msg.senderName}
              </div>
            )}
            <span style={{ background: msg.senderId === socket.id ? '#0084ff' : '#e4e6eb', color: msg.senderId === socket.id ? 'white' : 'black', padding: '8px 12px', borderRadius: '15px', display: 'inline-block' }}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: '20px', fontStyle: 'italic', color: 'gray', fontSize: '14px', marginBottom: '10px' }}>
        {typingUser ? `${typingUser} is typing...` : ''}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={message} 
          onChange={handleTyping} 
          placeholder="Type a message..." 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;