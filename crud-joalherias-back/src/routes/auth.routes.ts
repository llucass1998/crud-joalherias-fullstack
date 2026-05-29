import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export const authRoutes = Router();

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET nao configurado.");
  }

  return process.env.JWT_SECRET;
}

authRoutes.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);

  const userAlreadyExists = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (userAlreadyExists) {
    return res.status(409).json({ message: "E-mail ja cadastrado." });
  }

  const hashedPassword = await bcrypt.hash(data.password, 8);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const token = jwt.sign(user, getJwtSecret(), {
    expiresIn: "1d",
  });

  return res.status(201).json({ user, token });
});

authRoutes.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    return res.status(401).json({ message: "E-mail ou senha invalidos." });
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if (!passwordMatches) {
    return res.status(401).json({ message: "E-mail ou senha invalidos." });
  }

  const tokenUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const token = jwt.sign(tokenUser, getJwtSecret(), {
    expiresIn: "1d",
  });

  return res.json({ user: tokenUser, token });
});
