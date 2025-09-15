import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/boards");
    } catch (err) {
      alert("Login failed!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });

      // Kayıt başarılı olursa login moduna geç
      if (res.status === 200 || res.status === 201) {
        alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        setIsRegistering(false);
        // Form alanlarını temizle
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      alert("Kayıt işlemi başarısız!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isRegistering ? "Hesap Oluşturun" : "Hoş Geldiniz"}
        </h2>
        <p className="login-subtitle">
          {isRegistering ? "Yeni hesap oluşturun" : "Hesabınıza giriş yapın"}
        </p>
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Adınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <button type="submit" className="login-button">
            {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isRegistering ? "Zaten hesabınız var mı? " : "Hesabınız yok mu? "}
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="switch-button"
            >
              {isRegistering ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;