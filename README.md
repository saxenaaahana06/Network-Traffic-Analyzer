# Network Traffic Analyzer

## 1. Overview

The **Network Traffic Analyzer** is a web-based application designed to monitor, capture, analyze, and visualize network traffic in real time. It helps users understand the communication happening across a network by displaying packet information, network protocols, traffic statistics, and connection details through a modern dashboard.

The project aims to provide an easy-to-use alternative to traditional packet analysis tools by combining packet inspection capabilities with a user-friendly web interface.

## 2. Features

- **Live Packet Capture:** Capture network packets for real-time analysis.
- **Traffic Monitoring:** Monitor network activity and traffic statistics.
- **Protocol Analysis:** Identify protocols such as TCP, UDP, and ARP.
- **Packet Inspection:** View captured packet information and details.
- **Flow Analysis:** Organize network communication into flows.
- **Interactive Dashboard:** Display network activity using a modern web interface.
- **Capture Controls:** Start and stop packet capture from the dashboard.
- **Backend API:** Provide endpoints for communication between the frontend and backend.
- **Database Storage:** Store network traffic data for analysis.
- **Health Monitoring:** Check the status of the backend service.

## 3. Technologies Used

### Frontend
- React
- TypeScript
- JavaScript
- HTML
- CSS
- Node.js and npm

### Backend
- Python
- FastAPI
- Uvicorn
- Scapy

### Database
- SQLite

### Development Environment
- Windows 11
- Ubuntu on WSL2
- Visual Studio Code
- Git and GitHub

## 4. Project Structure

```text
network-traffic-analyzer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   └── tests/
├── frontend/
├── data/
│   └── network_analyzer.db
├── logs/
└── README.md
```

**Folder descriptions:**

- `backend/app/api/` – Contains API routes and endpoints.
- `backend/app/core/` – Contains core application configuration.
- `backend/app/models/` – Contains data models.
- `backend/app/services/` – Contains packet capture and traffic analysis logic.
- `backend/tests/` – Contains backend tests.
- `frontend/` – Contains the React-based user interface.
- `data/` – Stores the SQLite database.
- `logs/` – Stores application logs.

## 5. Installation

### Prerequisites

Install the following software before setting up the project:

- Python 3.11 or compatible version
- Node.js and npm
- Ubuntu on WSL2 or a compatible Linux environment
- Git (optional)

### Step 1: Clone the Repository

```bash
git clone <your-github-repository-url>
cd network-traffic-analyzer
```

If you already have the project on your computer, open its project directory instead.

### Step 2: Set Up the Backend

Open the Ubuntu terminal and navigate to the backend project directory.

Activate your Python environment or create a new virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the required packages:

```bash
pip install fastapi uvicorn scapy
```

**Note:** Install any additional dependencies required by the project. If a `requirements.txt` file is available, use:

```bash
pip install -r requirements.txt
```

### Step 3: Set Up the Frontend

Open a terminal in the frontend directory:

```bash
cd frontend
npm install
```

## 6. Usage

### Start the Backend

Navigate to the backend directory and activate the appropriate Python environment.

Start the FastAPI server using the actual application module configured in your project. For example:

```bash
uvicorn app.main:app --reload
```

The backend will typically be available at:

`http://127.0.0.1:8000`

Interactive API documentation can be accessed at:

`http://127.0.0.1:8000/docs`

### Start the Frontend

Open a separate terminal:

```bash
cd frontend
npm run dev
```

Open the local URL displayed in the terminal to access the dashboard.

### Analyze Network Traffic

1. Open the Network Traffic Analyzer dashboard.
2. Check the backend connection and capture status.
3. Start packet capture.
4. Monitor available network traffic and protocol statistics.
5. Inspect packet and flow information displayed by the application.
6. Stop packet capture when the analysis is complete.

**Note:** Packet capture may require administrator or root privileges and appropriate capture permissions. Only capture traffic on networks and devices you are authorized to monitor.

## 7. Results

The project has successfully implemented a FastAPI backend, a React-based dashboard, API-based communication, and a packet-capture and analysis workflow.

During earlier testing of the existing database, the following results were observed:

| Metric | Observed Value |
|---|---:|
| Packets recorded | 847 |
| Network flows | 16 |
| Total recorded bytes | 625,398 |
| TCP packets | 756 |
| UDP packets | 63 |
| ARP packets | 28 |

The dashboard and backend API have also been tested for application health and packet-capture status.

**Note:** These figures represent an earlier database snapshot and may differ from the current results. Actual screenshots of the dashboard can be added here to demonstrate the application's interface and functionality.

## 8. Future Improvements

- Add advanced packet filtering and searching.
- Improve packet-level inspection and detailed protocol analysis.
- Add graphical traffic statistics and historical trend analysis.
- Implement suspicious traffic and anomaly detection.
- Add configurable alerts for unusual network activity.
- Improve support for different network interfaces.
- Add export options for captured packets and analysis reports.
- Improve database management and long-term traffic storage.
- Strengthen error handling, security, and automated testing.
- Package the application for easier installation and deployment.

## 9. Author

**Author:** Aahana

**Project:** Network Traffic Analyzer

**GitHub:** [Add your GitHub profile or repository link here]

## 10. License

This project was developed for educational and academic purposes. A suitable open-source license can be added if the project is intended for public distribution.
