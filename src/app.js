const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;
const dataFilePath = path.join(__dirname, 'data', 'products.json');

app.use(express.json());

let products = loadProducts();

function loadProducts() {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

function saveProducts() {
  fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), 'utf-8');
}

app.get('/api/products', (req, res) => {
  const limit = parseInt(req.query.limit);
  let productList = products;

  if (!isNaN(limit)) {
    productList = productList.slice(0, limit);
  }

  res.json({ products: productList });
});

app.get('/api/products/:pid', (req, res) => {
  const pid = parseInt(req.params.pid);
  const product = products.find(product => product.id === pid);

  if (product) {
    res.json({ product });
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

app.post('/api/products', (req, res) => {
  const {
    title,
    description,
    code,
    price,
    stock,
    category,
    thumbnails
  } = req.body;

  if (!title || !description || !code || isNaN(price) || isNaN(stock) || !category) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  if (products.some(product => product.code === code)) {
    return res.status(409).json({ message: 'El código de este producto ya existe' });
  }

  const newProduct = {
    id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
    title,
    description,
    code,
    price: parseFloat(price),
    status: true,
    stock: parseInt(stock),
    category,
    thumbnails: thumbnails || []
  };

  products.push(newProduct);
  saveProducts();
  res.status(201).json({ product: newProduct });
});

app.put('/api/products/:pid', (req, res) => {
  const pid = parseInt(req.params.pid);
  const product = products.find(product => product.id === pid);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const {
    title,
    description,
    code,
    price,
    stock,
    category,
    thumbnails
  } = req.body;

  if (!title || !description || !code || isNaN(price) || isNaN(stock) || !category) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios excepto thumbnails, y price y stock deben ser números válidos' });
  }

  if (code !== product.code && products.some(product => product.code === code)) {
    return res.status(409).json({ message: 'El código de producto ya existe' });
  }

  product.title = title;
  product.description = description;
  product.code = code;
  product.price = parseFloat(price);
  product.stock = parseInt(stock);
  product.category = category;
  product.thumbnails = thumbnails || product.thumbnails;

  saveProducts();
  res.json({ product });
});

app.delete('/api/products/:pid', (req, res) => {
  const pid = parseInt(req.params.pid);
  const index = products.findIndex(product => product.id === pid);

  if (index !== -1) {
    products.splice(index, 1);
    saveProducts();
    res.json({ message: 'Producto eliminado correctamente' });
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

let carts = loadCarts();

function loadCarts() {
  try {
    const fileContents = fs.readFileSync(cartFilePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

function saveCarts() {
  fs.writeFileSync(cartFilePath, JSON.stringify(carts, null, 2), 'utf-8');
}

app.post('/api/carts', (req, res) => {
  const newCart = {
    id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
    products: []
  };

  carts.push(newCart);
  saveCarts();
  res.status(201).json({ cart: newCart });
});

app.get('/api/carts/:cid', (req, res) => {
  const cid = parseInt(req.params.cid);
  const cart = carts.find(cart => cart.id === cid);

  if (cart) {
    res.json({ products: cart.products });
  } else {
    res.status(404).json({ message: 'Carrito no encontrado' });
  }
});

app.post('/api/carts/:cid/product/:pid', (req, res) => {
  const cid = parseInt(req.params.cid);
  const pid = parseInt(req.params.pid);
  const quantity = parseInt(req.body.quantity) || 1;

  const cart = carts.find(cart => cart.id === cid);
  const product = products.find(product => product.id === pid);

  if (!cart || !product) {
    return res.status(404).json({ message: 'Carrito o producto no encontrado' });
  }

  const existingProduct = cart.products.find(item => item.product === pid);

  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    cart.products.push({ product: pid, quantity });
  }

  saveCarts();
  res.status(201).json({ cart });
});

app.listen(port, () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
});