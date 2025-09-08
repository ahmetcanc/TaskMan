import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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

// Dropdown komponenti
const TaskDropdownMenu = ({ taskId, onDelete }: { taskId: number, onDelete: (id: number) => void }) => {
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
      const response = await axios.delete(`http://localhost:8080/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        onDelete(taskId);
        console.log('Task silindi:', taskId);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
    setIsOpen(false);
  };

  const handleUpdate = () => {
    console.log('Update task:', taskId);
    // Burada update modal açabilir veya edit sayfasına yönlendirebilirsiniz
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

function Boards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8080/boards", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoards(res.data.data);
      } catch (err) {
        console.error("Error fetching boards:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  // Task silme fonksiyonu
  const handleDeleteTask = (taskId: number) => {
    setBoards(prevBoards => 
      prevBoards.map(board => ({
        ...board,
        Tasks: board.Tasks.filter(task => task.ID !== taskId)
      }))
    );
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

  return (
    <div className="boards-container">
      {boards.length > 0 && (
        <div className="board-card">
          <div className="board-cover" style={{ backgroundColor: getPriorityColor() }}>
            <h2 className="board-content" style={{ textAlign: "center", width: "100%", color: "white" }}>
              BOARD
            </h2>
          </div>
          <div className="board-content">
            <h2>{boards[0].Title}</h2>
            {getTasksByStatus(boards[0].Tasks).map(({ status, tasks }) => (
              <div key={status} className="list-preview">
                <h3>{status} ({tasks.length})</h3>
                <div className="cards-container">
                  {tasks.map(task => (
                    <div key={task.ID} className="card-mini" style={{ position: "relative" }}>
                      {/* Dropdown menü */}
                      <div style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                      }}>
                        <TaskDropdownMenu 
                          taskId={task.ID} 
                          onDelete={handleDeleteTask}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Boards;