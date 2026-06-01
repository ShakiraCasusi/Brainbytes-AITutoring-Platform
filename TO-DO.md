# Frontend TO-DOs & Next Steps

Based on the current project status, here are the recommended next steps and fixes focusing on the frontend:

## 1. Electron Desktop Build Issue

- **Issue:** Electron desktop launch failed previously due to a network termination error during the binary download.
- **Action:**
  - Configure `ELECTRON_MIRROR` or custom download proxies if the network is blocking the standard download URL.
  - Alternatively, download the Electron binary manually and cache it locally before running the build.
  - Verify the build runs successfully after network issues are resolved.

## 2. Real-time Chat Integration (WebSockets)

- **Context:** The backend has successfully implemented WebSocket real-time connections and events.
- **Action:**
  - Ensure the Next.js frontend uses `socket.io-client` (or native WebSockets) to connect to the backend WebSocket server.
  - Implement real-time incoming message rendering without needing to manually poll or refresh the page.
  - Add connection status indicators (e.g., "Connecting...", "Online") on the frontend UI.

## 3. Advanced Chat UI Features

- **Context:** Chat metadata now includes subject, question type, sentiment, and suggestions.
- **Action:**
  - **Markdown Support:** Render AI responses using a Markdown parser to display math formulas, bold text, lists, and code blocks effectively.
  - **Actionable Suggestions:** Display the suggested follow-up questions provided by the backend as clickable chips below the AI's response.
  - **Subject Badges:** Show the detected subject and question type visually in the chat UI.
  - **Sentiment Feedback:** Optional UI subtle changes based on user sentiment (e.g., encouraging tooltips if the user is confused).

## 4. Message History Pagination

- **Context:** Message history pagination is now supported by the backend.
- **Action:**
  - Implement "Load More" or infinite scrolling in the chat window to fetch older messages seamlessly.

## 5. Security & Maintenance

- **Action:**
  - Run `npm audit` on the frontend and carefully review dependencies. Address any moderate or high vulnerabilities by testing non-breaking updates.
  - Ensure proper error boundary components are set up in Next.js to handle potential frontend crashes gracefully.
