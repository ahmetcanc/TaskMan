import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditTask.css"; // CSS dosyası oluşturabilirsiniz

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

function EditTask() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const taskData = response.data.data;
        setTask(taskData);
        setTitle(taskData.Title);
        setDescription(taskData.Description);
        setStatus(taskData.Status);
      } catch (error) {
        console.error("Task yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/tasks/${task?.ID}`, {
        title: title,
        description: description,
        status: status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        console.log("Task güncellendi!");
        navigate("/boards"); // Boards sayfasına geri dön
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/boards");
  };

  if (isLoading) {
    return <div className="loading">Task yükleniyor...</div>;
  }

  if (!task) {
    return <div className="error">Task bulunamadı!</div>;
  }

  return (
    <div className="edit-task-container">
      <div className="edit-task-card">
        <div className="edit-task-header">
          <h1>Task Düzenle</h1>
          <p>ID: {task.ID}</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-task-form">
          <div className="form-group">
            <label htmlFor="title">Başlık</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-input"
              placeholder="Task başlığını girin"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Açıklama</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              placeholder="Task açıklamasını girin"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Durum</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Durum seçin</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="task-info">
            <p><strong>Oluşturulma:</strong> {new Date(task.CreatedAt).toLocaleDateString('tr-TR')}</p>
            <p><strong>Son Güncelleme:</strong> {new Date(task.UpdatedAt).toLocaleDateString('tr-TR')}</p>
            <p><strong>Board ID:</strong> {task.BoardID}</p>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="btn-cancel"
              disabled={isSaving}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={isSaving}
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTask;