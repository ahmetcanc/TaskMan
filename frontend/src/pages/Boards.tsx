import { useEffect, useState } from "react";
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
BOARD</h2>
          </div>
          <div className="board-content">
            <h2>{boards[0].Title}</h2>
            {getTasksByStatus(boards[0].Tasks).map(({ status, tasks }) => (
              <div key={status} className="list-preview">
                <h3>{status} ({tasks.length})</h3>
                <div className="cards-container">
  {tasks.map(task => (
    <div key={task.ID} className="card-mini" style={{ position: "relative" }}>
      {/* Delete button */}
      <span
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          cursor: "pointer",
        }}
        onClick={() => {
          // şimdilik sadece console.log, backend'e bağlayabilirsin
          console.log("Delete task ID:", task.ID);
        }}
      >
        ...
      </span>

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
