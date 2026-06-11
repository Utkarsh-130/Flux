# Flux <img width="34" height="34" alt="icon" src="https://github.com/user-attachments/assets/291e7da9-7958-4852-b355-99039fe567b2" />


Flux is a custom desktop client made using nextron designed to automatically filter, extract, and track job listings directly from target Telegram channels. Built, it cuts through the noise of busy Telegram groups to bring relevant job opportunities straight to your dashboard.

<img width="1901" height="980" alt="Screenshot 2026-06-02 025203" src="https://github.com/user-attachments/assets/30d42d23-4c2e-47ae-a29e-d092b74ddaea" />

##  Features

* **Automated Tracking:** Connects to your target Telegram channels and continuously listens for new messages.
* **Smart Filtering:** Parses incoming messages to identify and extract job listings, removing spam and irrelevant chatter.
* **Desktop-Native:** Packaged as an Electron app for a seamless desktop experience on Windows, macOS, and Linux.
* **Modern UI:** A clean, responsive dashboard built with Next.js and Tailwind CSS to easily read, sort, and apply for jobs.
* **Dedicated Python Engine:** Utilizes a robust Python backend for reliable Telegram API using telethon interactions and user session management.

  <img width="1916" height="1011" alt="Screenshot 2026-06-02 020019" src="https://github.com/user-attachments/assets/f20f2306-0097-4f0e-9d33-3cd413c6e496" />


## Tech Stack

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
* **Desktop Framework:** [Electron](https://www.electronjs.org/)
* **Backend Data Engine:** Python (Handles Telegram client functionality)
* **Package Management:** npm / pip

##  Project Structure

```text
Flux/
├── app/                 # Next.js App Router pages and frontend layouts
├── components/          # Reusable React components (shadcn/ui)
├── electron/            # Electron main process and preload scripts
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and shared logic
├── python-backend/      # Python scripts for Telegram API and job filtering
├── styles/              # Global CSS and Tailwind configuration
├── app.py               # Main entry point for the Python backend service
└── package.json         # Node dependencies and project scripts

 Getting Started
Prerequisites

    Node.js (v18+)

    Python (v3.8+)

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

