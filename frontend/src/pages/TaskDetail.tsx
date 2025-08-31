import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8080/tasks/${id}`, {
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

  if (isLoading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div>
      <h2>{task.Title}</h2>
      <p>{task.Description}</p>
      <p>Status: {task.Status}</p>
      <p>Updated: {new Date(task.UpdatedAt).toLocaleString()}</p>
    </div>
  );
}
