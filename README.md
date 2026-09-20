# File Host Server

A full-stack web-based file management platform built with React and FastAPI.

## Overview

File Host Server allows users to upload, preview, download, search, sort, and delete files through a clean and responsive web interface.

The project combines a React frontend with a Python FastAPI backend and local file storage.

## Features

- File upload
- Drag-and-drop upload
- File preview
- File download
- File deletion
- File search
- File sorting
- File size tracking
- Upload timestamp tracking
- Duplicate filename protection
- 100 MB upload limit
- Empty-file validation
- Filename sanitization
- Image preview
- PDF preview
- Text and CSV preview
- Video and audio preview
- Responsive user interface
- REST API backend

## Tech Stack

### Frontend

- React
- JavaScript
- Vite
- CSS

### Backend

- Python
- FastAPI
- REST APIs
- Uvicorn

### Storage

- Local filesystem storage

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Check backend status |
| POST | `/api/upload` | Upload a file |
| GET | `/api/files` | Get uploaded files |
| GET | `/api/preview/{filename}` | Preview a file |
| GET | `/api/download/{filename}` | Download a file |
| DELETE | `/api/delete/{filename}` | Delete a file |

## Project Structure

```text
file-host-server/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md