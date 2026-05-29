import { useState } from "react";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 404) {
        // Endpoint belum ada (masih pakai hermes dashboard bawaan)
        // Fallback: treat password sebagai token langsung
        if (!password) throw new Error("Masukkan token di kolom password");
        localStorage.setItem("hermes_token", password);
        onLogin(password);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login gagal");
      localStorage.setItem("hermes_token", data.token);
      onLogin(data.token);
    } catch (err) {
      if (err.message === "Failed to fetch") {
        // Server tidak reachable — fallback ke direct token
        if (password) {
          localStorage.setItem("hermes_token", password);
          onLogin(password);
          return;
        }
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "var(--font)",
      }}
    >
      <div
        style={{
          width: 380,
          background: "var(--s1)",
          border: "1px solid var(--bd)",
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              background: "linear-gradient(135deg, var(--ac), var(--bl))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 6,
            }}
          >
            Luna - Hermes Dashboard
          </div>
          <div style={{ fontSize: 13, color: "var(--t3)" }}>
            Masuk untuk melanjutkan
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                color: "var(--t3)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
              style={{
                background: "var(--s2)",
                border: "1px solid var(--bd2)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--t1)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--ac)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bd2)")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                color: "var(--t3)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--s2)",
                  border: "1px solid var(--bd2)",
                  borderRadius: 8,
                  padding: "10px 40px 10px 14px",
                  color: "var(--t1)",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--ac)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--bd2)")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--t3)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--red)",
                color: "var(--re)",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btp"
            style={{
              padding: "12px",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {loading ? (
              <span style={{ opacity: 0.7 }}>Masuk...</span>
            ) : (
              <>
                <LogIn size={16} /> Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
