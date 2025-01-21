import agent from "./agent.js";
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    // welcome message
    // ws.send(JSON.stringify({ user: 'AI:', message: 'Welcome to beauty and wellness center' }));

    ws.on('message', async (message) => {
        const msg = JSON.parse(message);
        msg.user = "AI:";
        const response = await agent(
            {
                role: "user",
                content: msg.message,
            });
        msg.message = response.content;
        ws.send(JSON.stringify(msg));
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
