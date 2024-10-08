

const express = require("express");
const sql = require("mssql/msnodesqlv8");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const fs = require("fs").promises;
const multer = require("multer");
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const axios = require("axios");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "http://localhost:3000", 
    methods: "GET,POST,PUT,DELETE", 
    credentials: true 
}));


const config = {
    user: "lissomPresenty1",
    password: "88xm3*rH5",
    server: "146.88.24.73",
    database: "LissomAtteandanceDB",
};


let pool;

async function initializePool() {
    try {
        pool = await sql.connect(config);
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'poojachavan081096@gmail.com',
        pass: 'quks xmdh uhxe bbkz',
    },
});

initializePool();

app.use(session({
    secret: '25b71c899d6fc9e2a4e19d88ad79221a43213cf550db90ee67c7dd08df8c006e',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/api/professor", async (req, res) => {
    const { firstName, middleName, lastName, motherName, email, phone, address, birthDate, age, joinDate } = req.body;

    try {
        const request = pool.request();
        await request
            .input("FirstName", sql.VarChar, firstName)
            .input("MiddleName", sql.VarChar, middleName)
            .input("LastName", sql.VarChar, lastName)
            .input("MotherName", sql.VarChar, motherName)
            .input("Email", sql.VarChar, email)
            .input("Phone", sql.VarChar, phone)
            .input("Address", sql.VarChar, address)
            .input("BirthDate", sql.Date, birthDate)
            .input("Age", sql.Int, age)
            .input("JoinDate", sql.Date, joinDate)
            .input("CreatedDate", sql.DateTime, new Date());

        // Use a single query with parameters instead of executing a command string
        const result = await request.query(`
            INSERT INTO Tbl_Professor 
            (FirstName, MiddleName, LastName, MotherName, Email, Phone, Address, BirthDate, Age, JoinDate, CreateDate) 
            VALUES 
            (@FirstName, @MiddleName, @LastName, @MotherName, @Email, @Phone, @Address, @BirthDate, @Age, @JoinDate, @CreatedDate)
        `);

        res.status(201).send({ message: "Professor created successfully." });
    } catch (error) {
        console.error("Error creating professor:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


app.get('/api/getprofessors', async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT ID, FirstName, MiddleName, LastName, MotherName, Email, Phone, Address, BirthDate, Age, JoinDate, CreateDate FROM Tbl_Professor');
  
      res.json(result.recordset); // Return the records as JSON
    } catch (error) {
      console.error("SQL error", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get('/api/professor/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const request = pool.request(); 
        const result = await request
            .input("Id", sql.Int, id) 
            .query('SELECT * FROM Tbl_Professor WHERE ID = @Id'); 

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: 'Professor not found' });
        }

        res.json(result.recordset[0]); // Send the found professor as JSON
    } catch (error) {
        console.error("Error fetching professor:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.put('/api/professor/:id', async (req, res) => {
    const { id } = req.params;
    const {
        firstName,
        middleName,
        lastName,
        motherName,
        email,
        phone,
        address,
        birthDate,
        age,
        joinDate,
    } = req.body;

    try {
        const request = pool.request(); // Use the initialized pool

       
        const result = await request
            .input("Id", sql.Int, id)
            .input("FirstName", sql.VarChar, firstName)
            .input("MiddleName", sql.VarChar, middleName)
            .input("LastName", sql.VarChar, lastName)
            .input("MotherName", sql.VarChar, motherName)
            .input("Email", sql.VarChar, email)
            .input("Phone", sql.VarChar, phone)
            .input("Address", sql.VarChar, address)
            .input("BirthDate", sql.Date, birthDate)
            .input("Age", sql.Int, age)
            .input("JoinDate", sql.Date, joinDate)
            .query(`
                UPDATE Tbl_Professor
                SET 
                    FirstName = @FirstName,
                    MiddleName = @MiddleName,
                    LastName = @LastName,
                    MotherName = @MotherName,
                    Email = @Email,
                    Phone = @Phone,
                    Address = @Address,
                    BirthDate = @BirthDate,
                    Age = @Age,
                    JoinDate = @JoinDate
                WHERE ID = @Id
            `);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'Professor updated successfully' });
        } else {
            res.status(404).json({ message: 'Professor not found' });
        }
    } catch (error) {
        console.error("Error updating professor:", error);
        res.status(500).json({ message: 'Server error' });
    }
});




const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

