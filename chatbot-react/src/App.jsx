import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle sending messages
  const handleSend = async () => {
    // Limit user to 5 messages
    if (messages.length >= 5) return;

    // Add user message to chat history
    setMessages([...messages, { text: input, sender: 'user' }]);

    // Clear input field after sending message
    setInput('');

    // Create the body of the request, which includes all previous messages (history)
    const requestBody = {
      messages: [...messages, { text: input, sender: 'user' }]
    };

    setLoading(true); // Show loading state

    try {
      // Send POST request to your OpenAI proxy
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = '';

      // While the stream is not done, keep reading chunks
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        text += decoder.decode(value, { stream: true });

        // Incrementally update the messages as new text is received
        setMessages(prevMessages => [
          ...prevMessages,
          { text: text, sender: 'bot' }
        ]);
      }
    } catch (error) {
      console.error('Error during streaming:', error);
    } finally {
      setLoading(false); // Hide loading state when done
    }
  };

  return (
    <div className="chat-container">
      {/* Display messages */}
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.sender === 'bot' ? (
              <ReactMarkdown children={msg.text} />
            ) : (
              <SyntaxHighlighter language="javascript" style={docco}>
                {msg.text}
              </SyntaxHighlighter>
            )}
          </div>
        ))}
      </div>

      {/* Input field for the user to type a message */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading || messages.length >= 5}
        placeholder="Type a message..."
      />

      {/* Send button to trigger handleSend */}
      <button onClick={handleSend} disabled={loading || !input}>Send</button>

      {/* Loading indicator */}
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
}

export default App;
