import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Boards.css";

interface Task {
  ID: number;
  Title: string;
  Description: string;
  Status: string;
  BoardID: number;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Board {
  ID: number;
  Title: string;
  Tasks: Task[];
}

const API_URL = import.meta.env.VITE_API_URL

// Create Task Modal Komponenti
const CreateTaskModal = ({ 
  isOpen, 
  onClose, 
  onCreate,
  boardId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newTask: Task) => void;
  boardId: number;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/tasks`, {
        title,
        description,
        status,
        board_id: boardId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        const newTask: Task = {
          ID: response.data.data.ID,
          Title: title,
          Description: description,
          Status: status,
          BoardID: boardId,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        };
        onCreate(newTask);
        onClose();
        // Form alanlarını temizle
        setTitle("");
        setDescription("");
        setStatus("todo");
      }
    } catch (error) {
      console.error('Task oluşturma hatası:', error);
      alert('Task oluşturulurken bir hata oluştu!');
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        width: "500px",
        maxWidth: "90vw",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Yeni Task Oluştur</h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#999"
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            >
              <option value="todo">📝 Todo</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Modal Komponenti
const EditTaskModal = ({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.Title);
      setDescription(task.Description);
      setStatus(task.Status);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/tasks/${task.ID}`, {
        title,
        description,
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        const updatedTask = {
          ...task,
          Title: title,
          Description: description,
          Status: status,
          UpdatedAt: new Date().toISOString()
        };
        onUpdate(updatedTask);
        onClose();
      }
    } catch (error) {
      console.error('Update hatası:', error);
      alert('Task güncellenirken bir hata oluştu!');
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        width: "500px",
        maxWidth: "90vw",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Task Düzenle</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#999"
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            >
              <option value="todo">📝 Todo</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dropdown komponenti
const TaskDropdownMenu = ({ 
  task,
  onDelete, 
  onEdit 
}: { 
  task: Task;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/tasks/${task.ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        onDelete(task.ID);
        console.log('Task silindi:', task.ID);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
    setIsOpen(false);
  };

  const handleUpdate = () => {
    onEdit(task);
    setIsOpen(false);
  };

  return (
    <div 
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
      onClick={(e) => e.preventDefault()}
    >
      <span
        style={{
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "16px"
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        ...
      </span>

      {isOpen && (
        <div style={{
          position: "absolute",
          right: "0",
          top: "100%",
          marginTop: "2px",
          width: "120px",
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 1000
        }}>
          <button
            onClick={handleUpdate}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              borderBottom: "1px solid #eee"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ✏️ Düzenle
          </button>
          <button
            onClick={handleDelete}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              color: "#dc3545"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff5f5"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            🗑️ Sil
          </button>
        </div>
      )}
    </div>
  );
};
// Boards.tsx - Board yoksa da ekran gösterilecek şekilde güncellendi

function Boards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchBoards = async () => {
      try {
        const res = await axios.get(`${API_URL}/boards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoards(res.data.data || []);
      } catch (err) {
        console.error("Error fetching boards:", err);
        setBoards([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Board oluşturma fonksiyonu
  const handleCreateBoard = async (boardTitle: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/boards`, {
        title: boardTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        const newBoard: Board = {
          ID: response.data.data.ID,
          Title: boardTitle,
          Tasks: []
        };
        setBoards(prev => [...prev, newBoard]);
        setIsCreateBoardModalOpen(false);
      }
    } catch (error) {
      console.error('Board oluşturma hatası:', error);
      alert('Board oluşturulurken bir hata oluştu!');
    }
  };

  // Diğer fonksiyonlar aynı kalıyor...
  const handleDeleteTask = (taskId: number) => {
    setBoards(prevBoards => 
      prevBoards.map(board => ({
        ...board,
        Tasks: board.Tasks.filter(task => task.ID !== taskId)
      }))
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setBoards(prevBoards => 
      prevBoards.map(board => ({
        ...board,
        Tasks: board.Tasks.map(task => 
          task.ID === updatedTask.ID ? updatedTask : task
        )
      }))
    );
  };

  const handleCreateTask = (newTask: Task) => {
    setBoards(prevBoards => 
      prevBoards.map(board => 
        board.ID === newTask.BoardID 
          ? { ...board, Tasks: [...board.Tasks, newTask] }
          : board
      )
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const getTasksByStatus = (tasks: Task[]) => {
    const statuses = ["todo", "in-progress", "done"];
    return statuses.map(status => ({
      status,
      tasks: tasks.filter(task => task.Status === status)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo": return "📝";
      case "in-progress": return "🔄";
      case "done": return "✅";
      default: return "📋";
    }
  };

  const getPriorityColor = () => {
    const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FECA57","#FF9FF3"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (isLoading) return <div>Loading...</div>;

  // Board yoksa empty state göster
  if (boards.length === 0) {
    return (
      <div className="boards-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa',
          padding: '60px 40px',
          borderRadius: '12px',
          border: '2px dashed #dee2e6',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
          <h2 style={{ color: '#495057', marginBottom: '16px' }}>
            Henüz Board'unuz Yok
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '30px', lineHeight: '1.5' }}>
            İlk board'unuzu oluşturarak task'lerinizi organize etmeye başlayın!
          </p>
          <button
            onClick={() => setIsCreateBoardModalOpen(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            📝 İlk Board'umu Oluştur
          </button>
        </div>

        {/* Create Board Modal */}
        <CreateBoardModal 
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
          onCreate={handleCreateBoard}
        />
      </div>
    );
  }

  // Board varsa normal ekranı göster
  return (
    <div className="boards-container">
      <div className="board-card">
        <div className="board-cover" style={{ backgroundColor: getPriorityColor() }}>
          <h2 className="board-content" style={{ textAlign: "center", width: "100%", color: "white" }}>
            BOARD
          </h2>
            <button
              onClick={handleLogout}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "20px",
                zIndex: "10"
              }}
            >
              🚪 Logout
            </button>
        </div>
        <div className="board-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>{boards[0].Title}</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsCreateBoardModalOpen(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                + Yeni Board
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                + Yeni Task
              </button>
            </div>
          </div>
          {getTasksByStatus(boards[0].Tasks).map(({ status, tasks }) => (
            <div key={status} className="list-preview">
              <h3>{getStatusIcon(status)} {status.toUpperCase()} ({tasks.length})</h3>
              <div className="cards-container">
                {tasks.map(task => (
                  <div key={task.ID} className="card-mini" style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                    }}>
                      <TaskDropdownMenu 
                        task={task}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                      />
                    </div>

                    <Link to={`/tasks/${task.ID}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                      <div className="card-content">
                        <div className="card-title">{task.Title}</div>
                        {task.Description && <div className="card-description">{task.Description}</div>}
                      </div>
                    </Link>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6c757d',
                    fontStyle: 'italic'
                  }}>
                    Bu durumda task yok
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal 
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        onCreate={handleCreateBoard}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateTask}
        boardId={boards.length > 0 ? boards[0].ID : 0}
      />

      {/* Edit Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
}

// Create Board Modal Komponenti - Yeni eklendi
const CreateBoardModal = ({ 
  isOpen, 
  onClose, 
  onCreate
}: { 
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
      setTitle("");
    }
  };

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        width: "400px",
        maxWidth: "90vw",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Yeni Board Oluştur</h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#999"
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Board Adı
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Proje Takibi"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
              autoFocus
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Boards;