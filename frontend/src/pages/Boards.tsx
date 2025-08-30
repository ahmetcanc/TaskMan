import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("JWT Token:", token); // test için
        const res = await axios.get("http://localhost:8080/boards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBoards(res.data.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error("Error fetching boards:", err.response?.data || err.message);
        } else if (err instanceof Error) {
          console.error("Error fetching boards:", err.message);
        } else {
          console.error("Unexpected error:", err);
        }
      }
    };

    fetchBoards();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Boards</h2>
      <ul>
        {boards.map((board) => (
          <li key={board.ID}>
            <Link to={`/tasks?boardId=${board.ID}`}>{board.Title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Boards;
