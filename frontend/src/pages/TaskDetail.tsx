import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./TaskDetail.css";

interface Task {
  ID: number;
  Title: string;
  Description: string;
  Status: string;
  BoardID: number;
  CreatedAt: string;
  UpdatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;


export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(res.data.data);
      } catch (err) {
        console.error("Error fetching task:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo": return "📝";
      case "in-progress": return "🔄";
      case "done": return "✅";
      default: return "📋";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="task-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Task yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-container">
        <div className="not-found-container">
          <div className="not-found-icon">❌</div>
          <h2 className="not-found-title">Task Bulunamadı</h2>
          <p className="not-found-message">Aradığınız task mevcut değil veya silinmiş olabilir.</p>
          <Link to="/boards" className="action-btn btn-back">
            <span>←</span>
            Boards'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="task-detail-container">
      <div className="task-detail-card">
        {/* Header Section */}
        <div className="task-detail-header">
          <div className="task-header-content">
            <nav className="task-breadcrumb">
              <Link to="/boards" className="breadcrumb-link">Boards</Link>
              <span className="breadcrumb-separator">›</span>
              <span>Task #{task.ID}</span>
            </nav>
            
            <h1 className="task-title">{task.Title}</h1>
            
            <div className="task-meta">
              <div className={`status-badge ${task.Status}`}>
                <span>{getStatusIcon(task.Status)}</span>
                <span>{task.Status}</span>
              </div>
              
              <div className="task-dates">
                <div className="date-item">
                  <span className="date-icon">📅</span>
                  <span>Oluşturuldu: {formatDate(task.CreatedAt)}</span>
                </div>
                <div className="date-item">
                  <span className="date-icon">🔄</span>
                  <span>Güncellendi: {formatDate(task.UpdatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="task-detail-content">
          {/* Description */}
          <div className="content-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              Açıklama
            </h3>
            <div className="description-box">
              {task.Description ? (
                <p className="task-description">{task.Description}</p>
              ) : (
                <p className="task-description no-description">
                  Bu task için henüz bir açıklama eklenmemiş.
                </p>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div className="content-section">
            <h3 className="section-title">
              <span className="section-icon">ℹ️</span>
              Task Bilgileri
            </h3>
            <div className="task-info-grid">
              <div className="info-card">
                <div className="info-label">
                  <span>🆔</span>
                  Task ID
                </div>
                <div className="info-value">#{task.ID}</div>
              </div>
              
              <div className="info-card">
                <div className="info-label">
                  <span>📊</span>
                  Durum
                </div>
                <div className="info-value">
                  {getStatusIcon(task.Status)} {task.Status}
                </div>
              </div>
              
              <div className="info-card">
                <div className="info-label">
                  <span>📋</span>
                  Board ID
                </div>
                <div className="info-value">#{task.BoardID}</div>
              </div>
              
              <div className="info-card">
                <div className="info-label">
                  <span>⏰</span>
                  Son Güncelleme
                </div>
                <div className="info-value">{formatDate(task.UpdatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="task-actions">
          <button 
            className="action-btn btn-back"
            onClick={() => navigate('/boards')}
          >
            <span>←</span>
            Boards'a Dön
          </button>
        </div>
      </div>
    </div>
  );
}