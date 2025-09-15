import { useEffect, useState } from "react";
import axios from "axios";

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


function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // JSON'daki "data" alanını alıyoruz
        setTasks(res.data.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.ID} style={{ marginBottom: "1rem" }}>
            <strong>{task.Title}</strong> <em>({task.Status})</em>
            <p>{task.Description}</p>
            <small>
              BoardID: {task.BoardID} <br />
              Created: {new Date(task.CreatedAt).toLocaleString()} <br />
              Updated: {new Date(task.UpdatedAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tasks;
