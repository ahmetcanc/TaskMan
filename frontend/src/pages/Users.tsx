import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreatedAt: string;
  UpdatedAt: string;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching users...");
        const res = await axios.get("http://localhost:8080/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data.data);
        console.log("Users fetched:", res.data.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.ID}>
            <strong>{user.Name}</strong> - {user.Email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
