# 📦 Inventory Management System

A simple Inventory Management System built using **HTML, CSS, JavaScript (Frontend)** and **Node.js + MongoDB (Backend)**.
This application helps manage products, track stock levels, and perform basic CRUD operations.

---

## 🚀 Features

* ➕ Add new products
* 📋 View all products
* ✏️ Update product details
* ❌ Delete products
* 🔍 Search products (optional)
* 📊 Track inventory levels

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB

---

## 📁 Project Structure

```
inventory-system/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── pages/
│
├── backend/
│   ├── server.js
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── middleware/
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/inventory-system.git
cd inventory-system
```

---

### 2️⃣ Install backend dependencies

```
cd backend
npm install
```

---

### 3️⃣ Setup environment variables

Create a `.env` file inside the backend folder:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

---

### 4️⃣ Run the server

```
npm start
```

Server will run on:

```
http://localhost:5000
```

---

### 5️⃣ Run frontend

Open `frontend/index.html` in your browser
(or use Live Server in VS Code)

---

## 🔌 API Endpoints

| Method | Endpoint          | Description      |
| ------ | ----------------- | ---------------- |
| GET    | /api/products     | Get all products |
| POST   | /api/products     | Add new product  |
| PUT    | /api/products/:id | Update product   |
| DELETE | /api/products/:id | Delete product   |

---

## 📌 Example Product Data

```json
{
  "name": "Laptop",
  "quantity": 10,
  "price": 150000,
  "category": "Electronics"
}
```

---

## 📈 Future Improvements

* 🔐 User authentication (Login/Register)
* 📊 Dashboard with analytics
* 📦 Stock alerts (low inventory)
* 📱 Responsive UI improvements

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork this repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

Imalsha Ridmani

---
