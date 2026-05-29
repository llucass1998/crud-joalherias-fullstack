import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middlewares/auth";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema";

export const productRoutes = Router();

function getIdParam(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id;
}

productRoutes.get("/", async (_req, res) => {
  const products = await prisma.product.findMany();

  return res.json(products);
});

productRoutes.get("/:id", async (req, res) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Id nao informado." });
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }

  return res.json(product);
});

productRoutes.post("/", authenticate, async (req, res) => {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data,
  });

  return res.status(201).json(product);
});

productRoutes.put("/:id", authenticate, async (req, res) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Id nao informado." });
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }

  const data = updateProductSchema.parse(req.body);

  const updatedProduct = await prisma.product.update({
    where: {
      id,
    },
    data,
  });

  return res.json(updatedProduct);
});

productRoutes.delete("/:id", authenticate, async (req, res) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Id nao informado." });
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return res.status(404).json({ message: "Produto nao encontrado." });
  }

  await prisma.product.delete({
    where: {
      id,
    },
  });

  return res.status(204).send();
});
