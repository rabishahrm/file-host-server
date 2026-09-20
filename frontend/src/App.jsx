import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://file-host-server-nwol.onrender.com";



const TEXT_EXTENSIONS = [
  "txt",
  "csv",
  "json",
  "html",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
];

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
];

const VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "ogg",
  "mov",
];

const AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "ogg",
  "m4a",
];

function getExtension(filename) {
  const parts = filename.split(".");

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : "";
}

function getFileType(filename) {
  const extension = getExtension(filename);

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return "image";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  if (TEXT_EXTENSIONS.includes(extension)) {
    return "text";
  }

  if (VIDEO_EXTENSIONS.includes(extension)) {
    return "video";
  }

  if (AUDIO_EXTENSIONS.includes(extension)) {
    return "audio";
  }

  return "other";
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${(
    bytes / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatUploadDate(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function App() {
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("name");

  const [sortOrder, setSortOrder] = useState("asc");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [serverOnline, setServerOnline] = useState(false);

  // Preview
  const [previewFile, setPreviewFile] = useState(null);

  const [previewContent, setPreviewContent] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewError, setPreviewError] = useState("");

  // --------------------------------------------------
  // LOAD FILES
  // --------------------------------------------------

  const loadFiles = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/files`
      );

      if (!response.ok) {
        throw new Error("Could not load files.");
      }

      const data = await response.json();

      setFiles(data.files || []);

      setServerOnline(true);

      setError("");
    } catch (err) {
      console.error("Connection error:", err);

      setServerOnline(false);

      setError(
        "Could not connect to the File Host Server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // --------------------------------------------------
  // UPLOAD
  // --------------------------------------------------

  const uploadFile = async (file) => {
    if (!file) return;

    setUploading(true);

    setMessage("");

    setError("");

    const formData = new FormData();

    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "File upload failed."
        );
      }

      setMessage(
        `"${data.filename}" uploaded successfully.`
      );

      await loadFiles();
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err.message ||
          "Could not upload the file."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    await uploadFile(file);

    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

    if (!file) return;

    await uploadFile(file);
  };

  // --------------------------------------------------
  // DOWNLOAD
  // --------------------------------------------------

  const handleDownload = (file) => {
    const url =
      `${API_URL}/api/download/` +
      encodeURIComponent(file.filename);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = file.filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // --------------------------------------------------
  // PREVIEW
  // --------------------------------------------------

  const handlePreview = async (file) => {
    const filename = file.filename;

    const extension =
      getExtension(filename);

    const previewUrl =
      `${API_URL}/api/preview/` +
      encodeURIComponent(filename);

    setPreviewFile(file);

    setPreviewContent("");

    setPreviewError("");

    setPreviewLoading(true);

    try {
      const response = await fetch(
        previewUrl
      );

      if (!response.ok) {
        throw new Error(
          "Unable to preview this file."
        );
      }

      if (
        TEXT_EXTENSIONS.includes(
          extension
        )
      ) {
        const text =
          await response.text();

        setPreviewContent(text);
      } else {
        setPreviewContent(previewUrl);
      }
    } catch (err) {
      console.error(
        "Preview error:",
        err
      );

      setPreviewError(
        "This file could not be previewed."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);

    setPreviewContent("");

    setPreviewError("");

    setPreviewLoading(false);
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (file) => {
    const confirmed =
      window.confirm(
        `Delete "${file.filename}"?`
      );

    if (!confirmed) return;

    try {
      setError("");

      setMessage("");

      const response = await fetch(
        `${API_URL}/api/delete/` +
          encodeURIComponent(
            file.filename
          ),
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not delete the file."
        );
      }

      setMessage(
        `"${file.filename}" deleted successfully.`
      );

      await loadFiles();
    } catch (err) {
      console.error(
        "Delete error:",
        err
      );

      setError(
        err.message ||
          "Could not delete the file."
      );
    }
  };

  // --------------------------------------------------
  // SEARCH + SORT
  // --------------------------------------------------

  const filteredFiles = useMemo(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    const result = files.filter(
      (file) =>
        file.filename
          .toLowerCase()
          .includes(search)
    );

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison =
          a.filename.localeCompare(
            b.filename
          );
      }

      if (sortBy === "size") {
        comparison =
          a.size - b.size;
      }

      if (sortBy === "date") {
        comparison =
          new Date(
            a.uploaded_at
          ) -
          new Date(
            b.uploaded_at
          );
      }

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    files,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  const changeSort = (value) => {
    if (value === sortBy) {
      setSortOrder(
        sortOrder === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortBy(value);

      setSortOrder("asc");
    }
  };

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalStorage =
    files.reduce(
      (total, file) =>
        total +
        Number(file.size || 0),
      0
    );

  const imageCount =
    files.filter(
      (file) =>
        getFileType(
          file.filename
        ) === "image"
    ).length;

  const documentCount =
    files.filter((file) => {
      const type =
        getFileType(
          file.filename
        );

      return (
        type === "pdf" ||
        type === "text"
      );
    }).length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="app">

      {/* HEADER */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-mark">
            FH
          </div>

          <div>
            <h1>
              File Host Server
            </h1>

            <p>
              Secure file storage and
              management
            </p>
          </div>

        </div>

        <div className="server-status">

          <span
            className={
              serverOnline
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          <span>
            {serverOnline
              ? "Server Online"
              : "Server Offline"}
          </span>

        </div>

      </header>

      <main className="main-container">

        {/* HERO */}

        <section className="hero-section">

          <div className="hero-text">

            <span className="eyebrow">
              FILE MANAGEMENT 
            </span>

            <h2>
              Your files,
              <br />
              <span>
                organized simply.
              </span>
            </h2>

            <p>
              Upload, preview, manage
              and download your files
              from one clean workspace.
            </p>

          </div>

          <div
            className="upload-card"
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={handleDrop}
          >

            <div className="upload-icon">
              ↑
            </div>

            <h3>
              {uploading
                ? "Uploading..."
                : "Upload a file"}
            </h3>

            <p>
              Drag and drop your file
              here or choose one from
              your computer.
            </p>

            <label className="upload-button">

              {uploading
                ? "Uploading..."
                : "Choose File"}

              <input
                type="file"
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />

            </label>

            <small>
              Maximum file size: 1 GB
            </small>

          </div>

        </section>

        {/* MESSAGES */}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">

            <span className="stat-label">
              Total Files
            </span>

            <strong>
              {files.length}
            </strong>

            <span className="stat-description">
              Stored files
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Storage Used
            </span>

            <strong>
              {formatFileSize(
                totalStorage
              )}
            </strong>

            <span className="stat-description">
              Across all files
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Documents
            </span>

            <strong>
              {documentCount}
            </strong>

            <span className="stat-description">
              PDFs and text files
            </span>

          </div>

          <div className="stat-card">

            <span className="stat-label">
              Images
            </span>

            <strong>
              {imageCount}
            </strong>

            <span className="stat-description">
              Image files
            </span>

          </div>

        </section>

        {/* FILES */}

        <section className="files-section">

          <div className="section-header">

            <div>

              <span className="section-kicker">
                STORAGE
              </span>

              <h2>
                Your Files
              </h2>

            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={loadFiles}
              disabled={loading}
            >
              Refresh
            </button>

          </div>

          {/* TOOLBAR */}

          <div className="toolbar">

            <div className="search-box">

              <span>
                Search
              </span>

              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="sort-controls">

              <span>
                Sort:
              </span>

              <button
                type="button"
                className={
                  sortBy === "name"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeSort("name")
                }
              >
                Name{" "}
                {sortBy === "name" &&
                  (sortOrder === "asc"
                    ? "↑"
                    : "↓")}
              </button>

              <button
                type="button"
                className={
                  sortBy === "size"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeSort("size")
                }
              >
                Size{" "}
                {sortBy === "size" &&
                  (sortOrder === "asc"
                    ? "↑"
                    : "↓")}
              </button>

              <button
                type="button"
                className={
                  sortBy === "date"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeSort("date")
                }
              >
                Date{" "}
                {sortBy === "date" &&
                  (sortOrder === "asc"
                    ? "↑"
                    : "↓")}
              </button>

            </div>

          </div>

          {/* FILE LIST */}

          {loading ? (

            <div className="empty-state">

              <h3>
                Loading files...
              </h3>

            </div>

          ) : filteredFiles.length ===
            0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                —
              </div>

              <h3>
                No files found
              </h3>

              <p>
                Upload a file or change
                your search.
              </p>

            </div>

          ) : (

            <div className="file-list">

              {filteredFiles.map(
                (file) => (

                  <div
                    className="file-row"
                    key={file.filename}
                  >

                    {/* NO FILE-TYPE LABEL */}

                    <div className="file-information">

                      <h3>
                        {file.filename}
                      </h3>

                      <p>

                        {formatFileSize(
                          file.size
                        )}

                        <span>
                          •
                        </span>

                        Uploaded{" "}
                        {formatUploadDate(
                          file.uploaded_at
                        )}

                      </p>

                    </div>

                    <div className="file-actions">

                      <button
                        type="button"
                        className="preview-button"
                        onClick={() =>
                          handlePreview(
                            file
                          )
                        }
                      >
                        Preview
                      </button>

                      <button
                        type="button"
                        className="download-button"
                        onClick={() =>
                          handleDownload(
                            file
                          )
                        }
                      >
                        Download
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(
                            file
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </main>

      {/* ==========================================
          PREVIEW MODAL
      ========================================== */}

      {previewFile && (

        <div
          className="preview-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closePreview();
            }

          }}
        >

          <div className="preview-modal">

            {/* MODAL HEADER */}

            <div className="preview-header">

              <div className="preview-title">

                <div>

                  <h2>
                    {previewFile.filename}
                  </h2>

                  <span>
                    {formatFileSize(
                      previewFile.size
                    )}
                  </span>

                </div>

              </div>

              <button
                type="button"
                className="preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="preview-body">

              {previewLoading && (

                <div className="preview-loading">

                  <div className="preview-spinner" />

                  <p>
                    Loading preview...
                  </p>

                </div>

              )}

              {!previewLoading &&
                previewError && (

                  <div className="preview-unavailable">

                    <h3>
                      Preview unavailable
                    </h3>

                    <p>
                      {previewError}
                    </p>

                  </div>

                )}

              {!previewLoading &&
                !previewError &&
                previewFile && (() => {

                  const type =
                    getFileType(
                      previewFile.filename
                    );

                  if (type === "image") {

                    return (
                      <div className="image-preview">

                        <img
                          src={previewContent}
                          alt={
                            previewFile.filename
                          }
                        />

                      </div>
                    );
                  }

                  if (type === "pdf") {

                    return (
                      <div className="pdf-preview">

                        <iframe
                          src={previewContent}
                          title={
                            previewFile.filename
                          }
                        />

                      </div>
                    );
                  }

                  if (type === "text") {

                    return (
                      <div className="text-preview">

                        <pre>
                          {previewContent}
                        </pre>

                      </div>
                    );
                  }

                  if (type === "video") {

                    return (
                      <div className="video-preview">

                        <video
                          controls
                          src={previewContent}
                        >
                          Your browser does not
                          support video playback.
                        </video>

                      </div>
                    );
                  }

                  if (type === "audio") {

                    return (
                      <div className="audio-preview">

                        <audio
                          controls
                          src={previewContent}
                        >
                          Your browser does not
                          support audio playback.
                        </audio>

                      </div>
                    );
                  }

                  return (
                    <div className="preview-unavailable">

                      <h3>
                        Preview not available
                      </h3>

                      <p>
                        This file type cannot
                        currently be previewed
                        inside the application.
                      </p>

                    </div>
                  );

                })()}

            </div>

            {/* MODAL FOOTER */}

            <div className="preview-footer">

              <span>
                Preview mode
              </span>

              <button
                type="button"
                className="preview-download-button"
                onClick={() =>
                  handleDownload(
                    previewFile
                  )
                }
              >
                Download File
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;