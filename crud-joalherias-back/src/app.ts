import cors from "cors";
import express from "express";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";

export const app = express();

app.use(cors());
app.use(express.json());


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
