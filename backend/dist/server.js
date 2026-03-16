import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import profileRoutes from "./routes/profile.js";
import adminRoutes from "./routes/admin.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
// Middleware
app.use(cors({
    origin: "http://65.2.183.102:5173", // Vite dev server
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Start
async function start() {
    await connectDB();
    app.listen(5000, "0.0.0.0", () => {
        console.log("Server running on port 5000");
    });
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map