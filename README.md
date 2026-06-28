# Smart Email Reply Assistant

An AI-powered email assistant that generates contextual, professional replies using Hugging Face Inference API (Qwen/Qwen3-0.6B). Designed to improve communication efficiency, this tool automates email responses with options to customize tone and style directly within a web app or Gmail extension.

---

## Features

- Automatically generates email replies based on the content of received messages  
- Integrated Gmail extension adds a **"Generate with AI"** button next to the native Send button  
- **Tone and style customization** available (e.g., formal, friendly, urgent, funny, etc.)  
- **Raw reply conversion**: Write your own draft reply and instantly convert it into any tone you choose  
- Built-in editor to review and modify AI-generated replies before sending  
- Supports copy-paste email input via the web interface for flexibility  

---

## Tech Stack

| Layer        | Technologies                          |
|--------------|---------------------------------------|
| Frontend     | React.js, HTML, CSS                   |
| Backend      | Java, Spring Boot                     |
| AI API       | Hugging Face Inference API (Qwen/Qwen3-0.6B) |
| Extension    | JavaScript (Gmail DOM manipulation)   |
| Tools        | Git, GitHub, REST APIs, VS Code       |

---

## Architecture Overview

![Smart Email Reply Assistant Client](src/main/resources/static/AI-Email-Assistant.jpeg)  
![Smart Email Reply Assistant Email Web Extension](src/main/resources/static/EmailWebExtension.jpeg)

1. **Frontend**
    - Provides a user-friendly UI with input fields and a tone selection dropdown
    - Displays AI-generated replies with an option to edit before copying or sending
    - **Static assets including images are located in:**  
      `src/main/resources/static`  
      Example image: `AI-Email-Assistant.png`

2. **Backend**
    - Accepts email content, raw reply, and tone/style preference via REST API
    - Processes the request and communicates with the Hugging Face Inference API
    - Returns a generated response based on the given context and tone

3. **Browser Extension**
    - Integrates into Gmail UI
    - Captures email content and optional raw reply  
    - Sends both to the backend along with the selected tone  
    - Inserts the AI-generated reply directly into the Gmail compose box

---

## How to Use

### Web App

1. Paste a received email into the input field  
2. (Optional) Add your own **raw reply** if you want it polished into a specific tone  
3. Select the desired tone or style (e.g., formal, friendly, urgent)  
4. Click **"Generate"**  
5. Review and copy the response into your actual email client  

### Gmail Extension

1. Install the Chrome extension  
2. Open Gmail and start composing a reply  
3. (Optional) Draft your own reply in the Gmail editor before generating  
4. Click the **"Generate with AI"** button  
5. AI-generated reply (based on email + raw reply + selected tone) will appear in the message box  
6. Make edits if needed and send  

---
