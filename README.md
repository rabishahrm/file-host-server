# File Host Server

A full-stack web-based file management platform built with React and FastAPI.

## Overview

File Host Server allows users to upload, preview, download, search, sort, and delete files through a clean web interface.

The project combines a React frontend with a Python FastAPI backend and local file storage.

## Features

- File upload
- Drag-and-drop upload
- 1 GB maximum file size per file
- Duplicate filename protection
- File listing
- File size and upload date tracking
- File search
- File sorting
- File preview
- Image preview
- PDF preview
- TXT and CSV preview
- File download
- File deletion
- Storage statistics
- Server status indicator
- Responsive interface
- REST API
- CORS configuration
- Filename security protection
- Empty-file rejection

## Tech Stack

### Frontend
- React
- JavaScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- Uvicorn
- REST API

### Storage
- Local filesystem storage

## Project Structure

```text
file-host-server/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
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
