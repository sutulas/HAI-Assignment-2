import { useState, useEffect, useRef } from 'react';
import './App.css';
import userAvatar from './images/user-avatar.jpg';
import botAvatar from './images/bot-avatar.jpg';
import Papa from 'papaparse'; // CSV parsing library

const url = process.env.NODE_ENV === 'production' ? 'https://course-tools-demo.onrender.com/' : 'http://127.0.0.1:8000/';

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState([{ type: "bot", text: "Hi! How can I help you?" }]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [csvData, setCsvData] = useState(null); // State to hold parsed CSV data
  const [showPreview, setShowPreview] = useState(false); // State to toggle CSV preview

  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [response]);

  function sendMessage() {
    if (message === "") return;

    const newMessage = { type: "user", text: message };

    fetch(`${url}query`, {
      method: 'POST',
      body: JSON.stringify({ prompt: message }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
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
    if (e.key === 'Enter') sendMessage();
  }

  function handleFileUpload(e) {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    parseCSV(uploadedFile);
    sendFile(uploadedFile); // Automatically send file to backend after upload
  }

  function sendFile(uploadedFile) {
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      fetch(`${url}uploadfile/`, {
        method: 'POST',
        body: formData,
      })
        .then(response => response.json())
        // .then(data => {
        //   const botResponse = { type: "bot", text: data.message};
        //   setResponse([...response, botResponse]);
        // })
        .catch(() => {
          const botResponse = { type: "bot", text: "Error processing file." };
          setResponse([...response, botResponse]);
        });
    }
  }

  // Parse CSV file and store data in state
  function parseCSV(file) {
    Papa.parse(file, {
      complete: function (results) {
        setCsvData(results.data);
      },
      header: true,
    });
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      parseCSV(droppedFile);
      sendFile(droppedFile); // Automatically send file to backend after drop
    }
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  // Function to handle CSV preview toggle
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">AI Assistant</h1>

      <div
        className={`drag-and-drop-area ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <p>Drag and drop a CSV file here or click to upload</p>
        <input
          type="file"
          accept=".csv"
          ref={inputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {file && (
        <div className="file-actions">
          <button onClick={togglePreview} className="preview-button">{showPreview ? 'Hide Preview' : 'Preview CSV'}</button>
        </div>
      )}

      {showPreview && csvData && (
        <div className="csv-preview">
          <table>
            <thead>
              <tr>
                {Object.keys(csvData[0] || {}).map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, idx) => (
                    <td key={idx}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
