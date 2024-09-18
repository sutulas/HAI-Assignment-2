import { useState, useEffect, useRef } from 'react';
import './App.css'; // Importing the CSS file for styling

// If you're using images from the src folder
import userAvatar from './images/user-avatar.png';
import botAvatar from './images/bot-avatar.jpg';

const url = process.env.NODE_ENV === 'production' ? 'https://course-tools-demo.onrender.com/' : 'http://127.0.0.1:8000/';

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState([
    { type: "bot", text: "Hi! How can I help you?" }
  ]);

  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [response]);

  function sendMessage() {
    if (message === "") {
      return;
    } 
    const newMessage = { type: "user", text: message };
    
    fetch(`${url}query`, {
      method: 'POST',
      body: JSON.stringify({ prompt: message }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
      .then(data => {
        const botResponse = { type: "bot", text: data.response };
        setResponse([...response, newMessage, botResponse]);
      });
    
    setMessage("");
  }
  

  function handleMessage(e) {   
    setMessage(e.target.value); 
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }

  return (
    <div className="chat-container">
      <h1 className="chat-title">AI Assistant</h1>
      <div className="chat-box" ref={chatBoxRef}>
        {response.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            <img 
              src={msg.type === "user" ? userAvatar : botAvatar} 
              alt="avatar" 
              className="avatar" 
            />
            <div className="message-bubble">
              <span>{msg.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input 
          type="text" 
          placeholder="Type your message here" 
          value={message} 
          className="input-field" 
          onInput={handleMessage} 
          onKeyDown={handleKeyDown} 
        />
        <button className="send-button" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
