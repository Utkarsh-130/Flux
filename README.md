# Flux <img width="34" height="34" alt="icon" src="https://github.com/user-attachments/assets/291e7da9-7958-4852-b355-99039fe567b2" />


Flux is a custom desktop client made using nextron designed to automatically filter, extract, and track opportunities and certification programs directly from target Telegram channels. Built, it cuts through the noise of busy Telegram groups to bring relevant job opportunities straight to your dashboard.

<img width="2558" height="1386" alt="Screenshot 2026-07-14 162637" src="https://github.com/user-attachments/assets/bdc6165a-c406-4d0d-820b-b2afb82e3018" />


##  Features
* **10x Smaller App Size:** By dropping the bundled Chromium environment and relying on the native webview provided by Tauri, the final installation size is a fraction of what it used to be. It downloads faster and takes up barely any disk space.

* **Zero Memory Overflows:** Running a background parser used to cause memory issues over time. Thanks to the strict memory management of Rust under the hood, those overflows are completely gone. You can leave Flux syncing all day without it slowing down your machine.
* **Automated Tracking:** Connects to your target Telegram channels and continuously listens for new messages.
* **Smart Filtering:** Parses incoming messages to identify and extract job listings, removing spam and irrelevant chatter.
* **Desktop-Native:** Packaged as an Electron app for a seamless desktop experience on Windows, macOS, and Linux.
* **Modern UI:** A clean, responsive dashboard built with Next.js and Tailwind CSS to easily read, sort, and apply for jobs.
* **Dedicated Python Engine:** Utilizes a robust Python backend for reliable Telegram API using telethon interactions and user session management.

<img width="2541" height="1377" alt="Screenshot 2026-07-14 161903" src="https://github.com/user-attachments/assets/54061195-3ccb-41aa-91f5-4ff4b6808b74" />


## Tech Stack

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
* **Desktop Framework:** [Tauri](https://tauri.app/) (Powered by Rust)
* **Backend Data Engine:** Python (Handles Telegram client functionality)
* **Package Management:** npm / pip

##  Project Structure

```text
Flux/
├── app/                 # Next.js App Router pages and frontend layouts
├── components/          # Reusable React components (shadcn/ui)
├── src-tauri/           # Tauri main process and Rust configurations
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and shared logic
├── python-backend/      # Python scripts for Telegram API and opportunity filtering
├── styles/              # Global CSS and Tailwind configuration
├── app.py               # Main entry point for the Python backend service
└── package.json         # Node dependencies and project scripts
 Getting Started
Prerequisites

    Node.js (v18+)

    Python (v3.8+)

    Rust

    Your Telegram API credentials (api_id and api_hash) from my.telegram.org.

Installation

    Clone the repository:
    Bash

    git clone [https://github.com/Utkarsh-130/Flux.git](https://github.com/Utkarsh-130/Flux.git)
    cd Flux

    Install Node dependencies:
    Bash

    npm install

    Setup the Python Backend:
    Navigate to the Python backend directory, set up a virtual environment, and install dependencies.
    Bash

    # (Example commands, adjust based on your specific requirements.txt or setup)
    cd python-backend
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
    pip install -r requirements.txt
    cd ..

    Configure Environment Variables:
    Create a .env file in the root directory and add your Telegram credentials and necessary keys.
    Code snippet

    TELEGRAM_API_ID=your_api_id
    TELEGRAM_API_HASH=your_api_hash

Running the App

To run the application in development mode (spins up both the Next.js server and the Electron wrapper):
Bash

npm run dev

(Make sure to also boot up your Python backend if it does not automatically start via the npm scripts).<img width="1024" height="1024" alt="icon" src="https://github.com/user-attachments/assets/de97c9da-1f14-4093-a640-0a7c12d81fb4" />

