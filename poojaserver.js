const express = require("express");
const sql = require("mssql/msnodesqlv8");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const fs = require("fs").promises;
const multer = require("multer");
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001","http://localhost:3002"],
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

const config = {
    user: 'lissomPresenty1', // Remove extra space
    password: '88xm3*rH5', // Remove extra space
    server: '146.88.24.73',
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


const saltRounds = 10; // Number of salt rounds

// When creating a new admin, hash the password:



//////////////////////////////////////////////////

app.post("/api/loginadmin", async (req, res) => {
    const { email, password, userName, deptName } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password
  
      let pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("email", sql.NVarChar, email)
        .input("password", sql.NVarChar, hashedPassword)
        .input("userName", sql.NVarChar, userName)
        .input("deptName", sql.NVarChar, deptName)
        .query("INSERT INTO Tbl_Admin (EmailID, Password, UserName, DeptName) VALUES (@email, @password, @userName, @deptName)");
  
      // Retrieve Contact_id from the inserted admin
      const contactResult = await pool.request()
        .input("email", sql.NVarChar, email)
        .query("SELECT ID AS Contact_id, EmailID AS userEmail, UserName AS userName, DeptName AS deptName FROM Tbl_Admin WHERE EmailID = @email");
  
      const adminData = contactResult.recordset[0]; // Assuming there's only one record returned
  
      res.json({
        success: true,
        Contact_id: adminData.Contact_id,
        userEmail: adminData.userEmail,
        userName: adminData.userName,
        deptName: adminData.deptName
      });
    } catch (err) {
      console.error("Error creating admin:", err.message);
      res.status(500).json({ error: 'Failed to create admin' });
    }
  });
  

  /////////////////////////////////////////////////////Department////////////////////////

  app.post('/api/departments', async (req, res) => {
    const { departmentName, description, status, createdDate, empId, designation } = req.body;
  
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Insert the new department into the database and get the inserted ID
      const result = await sql.query`
        INSERT INTO Tbl_Department (Department, Description, Status, CreateDate, EmpID, Designation)
        OUTPUT INSERTED.ID
        VALUES (${departmentName}, ${description}, ${status}, ${createdDate}, ${empId}, ${designation})`;
  
      res.status(201).send({ id: result.recordset[0].ID }); // Now this should work correctly
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } 
  });
  

  app.put('/api/departments/:id', async (req, res) => {
    const { id } = req.params;
    const { departmentName, description, status, createdDate, empId, designation, updateDate } = req.body;
  
    console.log('UpdateDate received:', updateDate); // Log the incoming update date
  
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Update the department in the database based on the ID
      const result = await sql.query`
        UPDATE Tbl_Department
        SET 
          Department = ${departmentName},
          Description = ${description},
          Status = ${status},
          CreateDate = ${createdDate}, 
          UpdateDate = ${updateDate},    
          EmpID = ${empId},
          Designation = ${designation}
        WHERE ID = ${id}
      `;
  
      // Check if any rows were affected
      if (result.rowsAffected[0] > 0) {
        res.status(200).send('Department updated successfully');
      } else {
        res.status(404).send('Department not found'); // If no rows were affected
      }
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).send('Internal Server Error');
    } 
  });

  app.put('/api/departments/update/:id', async (req, res) => {
    const { id } = req.params;
    const { Status } = req.body;
  
    try {
      await sql.connect(config);
  
      const result = await sql.query`
        UPDATE Tbl_Department
        SET Status = ${Status}
        WHERE ID = ${id}`;
  
      if (result.rowsAffected[0] > 0) {
        res.status(200).send('Status updated successfully');
      } else {
        res.status(404).send('Department not found');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
  app.get('/api/departments', async (req, res) => {
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Query to get departments
      const result = await sql.query`SELECT 
        ID, 
        Department, 
        Description, 
        Status, 
        CreateDate, 
        EmpID, 
        Designation 
      FROM Tbl_Department`;
  
      // Return the result as JSON
      res.json(result.recordset);
    } catch (error) {
      console.error('SQL error:', error);
      res.status(500).send('Error retrieving departments');
    } 
  });

  app.get('/api/departments/:id', async (req, res) => {
    const departmentId = req.params.id;
  
    try {
      const result = await pool.request()
        .input('department_id', sql.Int, departmentId) // Ensure this matches your database type
        .query(`
          SELECT ID, Department, Description, Status, CreateDate, EmpID, Designation
          FROM Tbl_Department
          WHERE ID = @department_id
        `);
  
      if (result.recordset.length > 0) {
        const departmentData = result.recordset[0];
        console.log("Department Data:", departmentData);
        res.json(departmentData);
      } else {
        console.log("Department not found for ID:", departmentId);
        res.status(404).json({ error: 'Department not found' });
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      res.status(500).json({ error: 'Failed to fetch department data' });
    }
  });

  // POST /api/departments
  app.delete('/api/departments/delete/:id', async (req, res) => {
    const id = req.params.id;
    console.log('Deleting department with ID:', id);

    // Add this log
    console.log('Request body:', req.body);
  
    try {
        const query = 'DELETE FROM Tbl_Department WHERE ID = @id';
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);
  
        console.log('Rows affected:', result.rowsAffected); // Log the number of affected rows

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
  
        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//////////////////////////////////////////////////Classroom///////////////

app.post('/api/classrooms', async (req, res) => {
    const { classRoom, description, classCapacity, status, createdDate, empId, designation } = req.body;
  
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Insert the new classroom into the database and get the inserted ID
      const result = await sql.query`
        INSERT INTO Tbl_ClassRoom (ClassRoom, Description, ClassCapacity, Status, CreateDate, EmpID, Designation)
        OUTPUT INSERTED.ID
        VALUES (${classRoom}, ${description}, ${classCapacity}, ${status}, ${createdDate}, ${empId}, ${designation})`;
  
      res.status(201).send({ id: result.recordset[0].ID }); // Respond with the new ID
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


  app.get('/api/classrooms', async (req, res) => {
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Query to get classrooms
      const result = await sql.query`
        SELECT 
          ID, 
          ClassRoom, 
          Description, 
          ClassCapacity, 
          Status, 
          CreateDate, 
          EmpID, 
          Designation 
        FROM Tbl_ClassRoom`;
  
      // Return the result as JSON
      res.json(result.recordset);
    } catch (error) {
      console.error('SQL error:', error);
      res.status(500).send('Error retrieving classrooms');
    }
  });
  

  app.get('/api/classrooms/:id', async (req, res) => {
    const classroomId = req.params.id;
  
    try {
      const result = await sql.query`
        SELECT ID, ClassRoom, Description, ClassCapacity, Status, CreateDate, EmpID, Designation
        FROM Tbl_ClassRoom
        WHERE ID = ${classroomId}`;
  
      if (result.recordset.length > 0) {
        const classroomData = result.recordset[0];
        res.json(classroomData);
      } else {
        res.status(404).json({ error: 'Classroom not found' });
      }
    } catch (error) {
      console.error("Error fetching classroom data:", error);
      res.status(500).json({ error: 'Failed to fetch classroom data' });
    }
  });

  app.put('/api/classrooms/:id', async (req, res) => {
    const { id } = req.params;
    const { classRoom, description, classCapacity, status, empId, designation, updateDate } = req.body;
  
    try {
      // Connect to the database
      await sql.connect(config);
  
      // Update the classroom in the database based on the ID
      await sql.query`
        UPDATE Tbl_ClassRoom
        SET 
          ClassRoom = ${classRoom},
          Description = ${description},
          ClassCapacity = ${classCapacity},
          Status = ${status},
          UpdateDate = ${updateDate},
          EmpID = ${empId},
          Designation = ${designation}
        WHERE ID = ${id}`;
  
      res.status(200).send({ message: 'Classroom updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// Update classroom status
app.put('/api/classrooms/update/:id', async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;

  try {
    await sql.connect(config);
    await sql.query`UPDATE Tbl_Classroom SET Status = ${Status} WHERE ID = ${id}`;
    res.status(200).send('Status updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating status');
  }
});



app.delete('/api/classrooms/delete/:id', async (req, res) => {
    const id = req.params.id;
  
    try {
      const result = await sql.query`
        DELETE FROM Tbl_ClassRoom WHERE ID = ${id}`;
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Classroom not found' });
      }
  
      res.status(200).json({ message: 'Classroom deleted successfully' });
    } catch (error) {
      console.error('Error deleting classroom:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  //////////////////////////////////////////////DEGREE/////////////


// POST /api/degrees - Create a new degree
app.post('/api/degrees', async (req, res) => {
  let { degreeName, empId, description, status, createdDate } = req.body;

  const maxDegreeNameLength = 150; // Set based on your table definition
  if (degreeName.length > maxDegreeNameLength) {
    degreeName = degreeName.substring(0, maxDegreeNameLength); // Truncate if too long
  }

  try {
    // Connect to the database
    await sql.connect(config);

    // Insert the new degree into the database and get the inserted ID
    const result = await sql.query`
      INSERT INTO Tbl_Degree (DegreeName, EmpID, Description, Status, CreateDate)
      OUTPUT INSERTED.ID
      VALUES (${degreeName}, ${empId}, ${description}, ${status}, ${createdDate})`;

    res.status(201).send({ id: result.recordset[0].ID }); // Respond with the new ID
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/degrees', async (req, res) => {
  try {
    // Connect to the database
    await sql.connect(config);

    // Query to get degrees
    const result = await sql.query`
      SELECT 
        ID, 
        DegreeName, 
        EmpID, 
        Description, 
        Status, 
        CreateDate 
      FROM Tbl_Degree`;

    // Return the result as JSON
    res.json(result.recordset);
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).send('Error retrieving degrees');
  }
});

  app.get('/api/degrees/:id', async (req, res) => {
  const degreeId = req.params.id;

  try {
    const result = await sql.query`
      SELECT ID, DegreeName, EmpID, Description, Status, CreateDate
      FROM Tbl_Degree
      WHERE ID = ${degreeId}`;

    if (result.recordset.length > 0) {
      const degreeData = result.recordset[0];
      res.json(degreeData);
    } else {
      res.status(404).json({ error: 'Degree not found' });
    }
  } catch (error) {
    console.error("Error fetching degree data:", error);
    res.status(500).json({ error: 'Failed to fetch degree data' });
  }
});
app.put('/api/degrees/:id', async (req, res) => {
  const { id } = req.params;
  const { degreeName, empId, description, status, updateDate } = req.body;

  try {
    // Connect to the database
    await sql.connect(config);

    // Update the degree in the database based on the ID
    await sql.query`
      UPDATE Tbl_Degree
      SET 
        DegreeName = ${degreeName},
        EmpID = ${empId},
        Description = ${description},
        Status = ${status},
        UpdateDate = ${updateDate}
      WHERE ID = ${id}`;

    res.status(200).send({ message: 'Degree updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/degrees/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await sql.query`
      DELETE FROM Tbl_Degree WHERE ID = ${id}`;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Degree not found' });
    }

    res.status(200).json({ message: 'Degree deleted successfully' });
  } catch (error) {
    console.error('Error deleting degree:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});
////////////////////////////////////////YEAR////////////////////////////////



app.post('/api/years', async (req, res) => {
  let { yearName, empId, description, status, createdDate } = req.body;

  const maxYearNameLength = 150; // Set based on your table definition
  if (yearName.length > maxYearNameLength) {
    yearName = yearName.substring(0, maxYearNameLength); // Truncate if too long
  }

  try {
    // Connect to the database
    await sql.connect(config);

    // Insert the new year into the database and get the inserted ID
    const result = await sql.query`
      INSERT INTO Tbl_Year (YearName, EmpID, Description, Status, CreateDate)
      OUTPUT INSERTED.ID
      VALUES (${yearName}, ${empId}, ${description}, ${status}, GETDATE())`; // Use GETDATE() for current date

    res.status(201).send({ id: result.recordset[0].ID }); // Respond with the new ID
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/api/years', async (req, res) => {
  try {
    // Connect to the database
    await sql.connect(config);

    // Query to get years
    const result = await sql.query`
      SELECT 
        ID, 
        YearName, 
        EmpID, 
        Description, 
        Status, 
        CreateDate 
      FROM Tbl_Year`;

    // Return the result as JSON
    res.json(result.recordset);
  } catch (error) {
    console.error('SQL error:', error);
    res.status(500).send('Error retrieving years');
  }
});


app.get('/api/years/:id', async (req, res) => {
  const yearId = req.params.id;

  try {
    const result = await sql.query`
      SELECT ID, YearName, EmpID, Description, Status, CreateDate
      FROM Tbl_Year
      WHERE ID = ${yearId}`;

    if (result.recordset.length > 0) {
      const yearData = result.recordset[0];
      res.json(yearData);
    } else {
      res.status(404).json({ error: 'Year not found' });
    }
  } catch (error) {
    console.error("Error fetching year data:", error);
    res.status(500).json({ error: 'Failed to fetch year data' });
  }
});


app.put('/api/years/:id', async (req, res) => {
  const { id } = req.params;
  const { yearName, empId, description, status } = req.body;

  try {
    // Connect to the database
    await sql.connect(config);

    // Update the year in the database based on the ID
    await sql.query`
      UPDATE Tbl_Year
      SET 
        YearName = ${yearName},
        EmpID = ${empId},
        Description = ${description},
        Status = ${status},
        UpdateDate = GETDATE()
      WHERE ID = ${id}`;

    res.status(200).send({ message: 'Year updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.delete('/api/years/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await sql.query`
      DELETE FROM Tbl_Year WHERE ID = ${id}`;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Year not found' });
    }

    res.status(200).json({ message: 'Year deleted successfully' });
  } catch (error) {
    console.error('Error deleting year:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



///////////////////////////////////SEMESTER//////////////////////



app.post('/api/semesters', async (req, res) => {
  const { semesterName, yearName, empId, description, status } = req.body;

  try {
      await sql.connect(config);
      const result = await sql.query`
          INSERT INTO Tbl_Semester (SemesterName, YearName, EmpID, Description, Status, CreateDate)
          OUTPUT INSERTED.ID
          VALUES (${semesterName}, ${yearName}, ${empId}, ${description}, ${status}, GETDATE())`;
      res.status(201).send({ id: result.recordset[0].ID });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/api/semesters', async (req, res) => {
  try {
      await sql.connect(config);
      const result = await sql.query`
          SELECT 
              ID, 
              SemesterName, 
              YearName, 
              EmpID, 
              Description, 
              Status, 
              CreateDate 
          FROM Tbl_Semester`;
      res.json(result.recordset);
  } catch (error) {
      console.error('SQL error:', error);
      res.status(500).send('Error retrieving semesters');
  }
});




app.get('/api/semesters/:id', async (req, res) => {
  const semesterId = req.params.id;

  try {
      const result = await sql.query`
          SELECT ID, SemesterName, YearName, EmpID, Description, Status, CreateDate
          FROM Tbl_Semester
          WHERE ID = ${semesterId}`;

      if (result.recordset.length > 0) {
          res.json(result.recordset[0]);
      } else {
          res.status(404).json({ error: 'Semester not found' });
      }
  } catch (error) {
      console.error("Error fetching semester data:", error);
      res.status(500).json({ error: 'Failed to fetch semester data' });
  }
});


app.put('/api/semesters/:id', async (req, res) => {
  const { id } = req.params;
  const { semesterName, yearName, empId, description, status } = req.body;

  try {
      await sql.connect(config);
      await sql.query`
          UPDATE Tbl_Semester
          SET 
              SemesterName = ${semesterName},
              YearName = ${yearName},
              EmpID = ${empId},
              Description = ${description},
              Status = ${status},
              UpdateDate = GETDATE()
          WHERE ID = ${id}`;

      res.status(200).send({ message: 'Semester updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});





app.delete('/api/semesters/:id', async (req, res) => {
  const id = req.params.id;

  try {
      const result = await sql.query`
          DELETE FROM Tbl_Semester WHERE ID = ${id}`;

      if (result.rowsAffected[0] === 0) {
          return res.status(404).json({ message: 'Semester not found' });
      }

      res.status(200).json({ message: 'Semester deleted successfully' });
  } catch (error) {
      console.error('Error deleting semester:', error.message);
      res.status(500).json({ message: 'Internal server error' });
  }
});

/////////////////////////////////////////SUBJECT/////////////////////

app.post('/api/subjects', async (req, res) => {
  const { subjectName, status, createdDate, empId, designation, departmentID, department } = req.body;

  try {
    await sql.connect(config);
    
    // Insert the new subject into the database with current time for CreatedDate
    const result = await sql.query`
      INSERT INTO Tbl_Subject (SubjectName, Status, CreateDate, EmpID, Designation, DepartmentID, Department)
      OUTPUT INSERTED.ID
      VALUES (${subjectName}, ${status}, GETDATE(), ${empId}, ${designation}, ${departmentID}, ${department})`;

    res.status(201).send({ id: result.recordset[0].ID });
  } catch (error) {
    console.error('Error inserting subject:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Get all Subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Tbl_Subject');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).send('Error fetching subjects');
  }
});

// Get Subject by ID
app.get('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('ID', sql.Int, id)
      .query('SELECT * FROM Tbl_Subject WHERE ID = @ID');
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).send('Error fetching subject');
  }
});

// Update Subject
app.put('/api/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { subjectName, status, empId, designation, departmentID, department } = req.body;

  try {
    await sql.connect(config);
    
    // Update the subject, keeping the CreatedDate unchanged and updating the UpdatedDate
    const result = await sql.query`
      UPDATE Tbl_Subject
      SET SubjectName = ${subjectName},
          Status = ${status},
          EmpID = ${empId},
          Designation = ${designation},
          DepartmentID = ${departmentID},
          Department = ${department},
          UpdateDate = GETDATE() -- Set the updated date to current time
      WHERE ID = ${id}`;

    if (result.rowsAffected[0] > 0) {
      res.status(200).send('Subject updated successfully');
    } else {
      res.status(404).send('Subject not found');
    }
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete Subject
app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.request()
      .input('ID', sql.Int, id)
      .query('DELETE FROM Tbl_Subject WHERE ID = @ID');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).send('Error deleting subject');
  }
});


//////////////////////////////////////////////PRIFIX/////////////////////////////////////





app.post('/api/prefixes', async (req, res) => {
  const { prefixName, empId, designation, status } = req.body;

  try {
      await sql.connect(config);
      const result = await sql.query`
          INSERT INTO Tbl_Prefix (PrefixName, EmpID, Designation, Status, CreateDate)
          OUTPUT INSERTED.ID
          VALUES (${prefixName}, ${empId}, ${designation}, ${status}, GETDATE())`;
      res.status(201).send({ id: result.recordset[0].ID });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/api/prefixes', async (req, res) => {
  try {
      await sql.connect(config);
      const result = await sql.query`
          SELECT 
              ID, 
              PrefixName, 
              EmpID, 
              Designation, 
              Status, 
              CreateDate 
          FROM Tbl_Prefix`;
      res.json(result.recordset);
  } catch (error) {
      console.error('SQL error:', error);
      res.status(500).send('Error retrieving prefixes');
  }
});

app.get('/api/prefixes/:id', async (req, res) => {
  const prefixId = req.params.id;

  try {
      const result = await sql.query`
          SELECT ID, PrefixName, EmpID, Designation, Status, CreateDate
          FROM Tbl_Prefix
          WHERE ID = ${prefixId}`;

      if (result.recordset.length > 0) {
          res.json(result.recordset[0]);
      } else {
          res.status(404).json({ error: 'Prefix not found' });
      }
  } catch (error) {
      console.error("Error fetching prefix data:", error);
      res.status(500).json({ error: 'Failed to fetch prefix data' });
  }
});

app.put('/api/prefixes/:id', async (req, res) => {
  const { id } = req.params;
  const { prefixName, empId, designation, status } = req.body;

  try {
      await sql.connect(config);
      await sql.query`
          UPDATE Tbl_Prefix
          SET 
              PrefixName = ${prefixName},
              EmpID = ${empId},
              Designation = ${designation},
              Status = ${status},
              UpdateDate = GETDATE()
          WHERE ID = ${id}`;

      res.status(200).send({ message: 'Prefix updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/prefixes/:id', async (req, res) => {
  const id = req.params.id;

  try {
      const result = await sql.query`
          DELETE FROM Tbl_Prefix WHERE ID = ${id}`;

      if (result.rowsAffected[0] === 0) {
          return res.status(404).json({ message: 'Prefix not found' });
      }

      res.status(200).json({ message: 'Prefix deleted successfully' });
  } catch (error) {
      console.error('Error deleting prefix:', error.message);
      res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/phases', async (req, res) => {
    const { phaseName, status, empId, designation } = req.body;
  
    try {
      await sql.connect(config);
  
      // Insert the new phase into the database with current time for CreateDate
      const result = await sql.query`
        INSERT INTO Tbl_Phase (PhaseName, Status, CreateDate, EmpID, Designation)
        OUTPUT INSERTED.ID
        VALUES (${phaseName}, ${status}, GETDATE(), ${empId}, ${designation})`;
  
      res.status(201).send({ id: result.recordset[0].ID });
    } catch (error) {
      console.error('Error inserting phase:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Get all Phases
  app.get('/api/phases', async (req, res) => {
    try {
      const result = await sql.query('SELECT * FROM Tbl_Phase');
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error('Error fetching phases:', error);
      res.status(500).send('Error fetching phases');
    }
  });
  
  // Get Phase by ID
  app.get('/api/phases/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await sql.query`
        SELECT * FROM Tbl_Phase WHERE ID = ${id}`;
      res.status(200).json(result.recordset[0]);
    } catch (error) {
      console.error('Error fetching phase:', error);
      res.status(500).send('Error fetching phase');
    }
  });
  
  // Update Phase
  app.put('/api/phases/:id', async (req, res) => {
    const { id } = req.params;
    const { phaseName, status, empId, designation } = req.body;
  
    try {
      await sql.connect(config);
  
      // Update the phase, keeping the CreatedDate unchanged and updating the UpdatedDate
      const result = await sql.query`
        UPDATE Tbl_Phase
        SET PhaseName = ${phaseName},
            Status = ${status},
            EmpID = ${empId},
            Designation = ${designation},
            UpdateDate = GETDATE() -- Set the updated date to current time
        WHERE ID = ${id}`;
  
      if (result.rowsAffected[0] > 0) {
        res.status(200).send('Phase updated successfully');
      } else {
        res.status(404).send('Phase not found');
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Update Phase Status
  app.put('/api/phases/update/:id', async (req, res) => {
    const { id } = req.params;
    const { Status } = req.body;
  
    console.log(`Updating phase ID: ${id}, Status: ${Status}`); // Debugging log
  
    try {
      await sql.connect(config);
  
      const result = await sql.query`
        UPDATE Tbl_Phase 
        SET Status = ${Status} 
        WHERE ID = ${id}`;
  
      if (result.rowsAffected[0] > 0) {
        res.status(200).send('Phase status updated successfully');
      } else {
        res.status(404).send('Phase not found');
      }
    } catch (error) {
      console.error('Error updating phase status:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Delete Phase
  app.delete('/api/phases/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await sql.query`
        DELETE FROM Tbl_Phase WHERE ID = ${id}`;
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting phase:', error);
      res.status(500).send('Error deleting phase');
    }
  });
  

  //---------------------------Professor-----------------------------------------

  app.post("/api/professor", async (req, res) => {
    const { empId, firstName, middleName, lastName, email, contact, birthDate, joiningDate, namePrefix, department, education, post, isActive } = req.body;

    try {
      const request = pool.request();
      await request
        .input("EmpId", sql.VarChar, empId)
        .input("FirstName", sql.VarChar, firstName)
        .input("MiddleName", sql.VarChar, middleName)
        .input("LastName", sql.VarChar, lastName)
        .input("Email", sql.VarChar, email)
        .input("Phone", sql.VarChar, contact)
        .input("BirthDate", sql.Date, birthDate)
        .input("JoinDate", sql.Date, joiningDate) // use joiningDate here
        .input("Prefix", sql.VarChar, namePrefix) // use namePrefix here
        .input("Department", sql.VarChar, department)
        .input("Education", sql.VarChar, education)
        .input("Post", sql.VarChar, post)
        .input("Status", sql.Int, isActive ? 1 : 0) // Assuming isActive is boolean
        .input("CreatedDate", sql.DateTime, new Date());
    
      await request.query(`
        INSERT INTO Tbl_Professor 
        (EmpNumber, FirstName, MiddleName, LastName, Email, Phone, BirthDate, JoinDate, Prefix, Department, Education, Post, Status, CreateDate) 
        VALUES 
        (@EmpId, @FirstName, @MiddleName, @LastName, @Email, @Phone, @BirthDate, @JoinDate, @Prefix, @Department, @Education, @Post, @Status, @CreatedDate)
      `);
  
      res.status(201).send({ message: "Professor created successfully." });
    } catch (error) {
      console.error("Error creating professor:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
});


// GET: Get all professors
app.get('/api/getprofessors', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Tbl_Professor');
        res.json(result.recordset); // Return the records as JSON
    } catch (error) {
        console.error("SQL error", error);
        res.status(500).send("Internal Server Error");
    }
});

// GET: Get a professor by ID
app.get('/api/getprofessor/:id', async (req, res) => {
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

// PUT: Update a professor by ID
app.put('/api/professor/:id', async (req, res) => {
  const { id } = req.params;
  const {
      empId,
      firstName,
      middleName,
      lastName,
      email,
      contact, // Corrected from phone to contact
      birthDate,
      joiningDate, // Corrected from joinDate to joiningDate
      namePrefix, // Corrected from prefix to namePrefix
      department,
      education,
      post,
      isActive // Corrected from status to isActive
  } = req.body;

  try {
      const request = pool.request();

      const result = await request
          .input("Id", sql.Int, id)
          .input("FirstName", sql.VarChar, firstName)
          .input("MiddleName", sql.VarChar, middleName)
          .input("LastName", sql.VarChar, lastName)
          .input("Email", sql.VarChar, email)
          .input("Contact", sql.VarChar, contact) // Updated input variable
          .input("BirthDate", sql.Date, birthDate)
          .input("JoiningDate", sql.Date, joiningDate) // Updated input variable
          .input("NamePrefix", sql.VarChar, namePrefix) // Updated input variable
          .input("Department", sql.VarChar, department)
          .input("Education", sql.VarChar, education) // Added education field
          .input("Post", sql.VarChar, post)
          .input("IsActive", sql.Bit, isActive) // Changed to sql.Bit for boolean
          .query(`
              UPDATE Tbl_Professor
              SET 
                  FirstName = @FirstName,
                  MiddleName = @MiddleName,
                  LastName = @LastName,
                  Email = @Email,
                  Phone = @Contact,
                  BirthDate = @BirthDate,
                  JoinDate = @JoiningDate,
                  Prefix = @NamePrefix,
                  Department = @Department,
                  Education = @Education, 
                  Post = @Post,
                  Status = @IsActive 
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


app.put('/api/updateprofessorstatus/:id', async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body; // This should be a boolean value to update the status

  try {
      const request = pool.request();

      const result = await request
          .input("Id", sql.Int, id)
          .input("Status", sql.Bit, Status) // Assuming Status is a boolean (0 or 1)
          .query(`
              UPDATE Tbl_Professor
              SET 
                  Status = @Status
              WHERE ID = @Id
          `);

      if (result.rowsAffected[0] > 0) {
          res.status(200).json({ message: 'Professor status updated successfully' });
      } else {
          res.status(404).json({ message: 'Professor not found' });
      }
  } catch (error) {
      console.error("Error updating professor status:", error);
      res.status(500).json({ message: 'Server error' });
  }
});



//--------------------------------------Student-------------------------------------------------------------//



app.post("/api/student", async (req, res) => {
  const {
      rollNo,
      prnNo,
      phase,
      degree,
      semester,
      attendanceId,
      firstName,
      middleName,
      lastName,
      contact,
      email,
      relation,
      contactNo,
      parentEmail,
      whatsappNo,
      address
  } = req.body;

  try {
      const request = pool.request();
      await request
          .input("RollNo", sql.VarChar, rollNo)
          .input("PrnNo", sql.VarChar, prnNo)
          .input("Phase", sql.VarChar, phase)
          .input("Degree", sql.VarChar, degree)
          .input("Semester", sql.VarChar, semester)
          .input("AttendanceId", sql.VarChar, attendanceId)
          .input("FirstName", sql.VarChar, firstName)
          .input("MiddleName", sql.VarChar, middleName)
          .input("LastName", sql.VarChar, lastName)
          .input("Contact", sql.VarChar, contact)
          .input("Email", sql.VarChar, email)
          .input("Relation", sql.VarChar, relation)
          .input("ParentContactNo", sql.VarChar, contactNo)
          .input("ParentEmail", sql.VarChar, parentEmail)
          .input("WhatsappNo", sql.VarChar, whatsappNo)
          .input("ParentAddress", sql.VarChar, address)
          .input("CreatedDate", sql.DateTime, new Date());

      // Use a single query with parameters to insert the student and parent info
      const result = await request.query(`
          INSERT INTO Tbl_Student 
          (RollNumber, PNPNumber, Phase, Degree, Semester, AttendanceID, FirstName, MiddleName, LastName, Phone, Email, 
           ParentRelation, ParentContact, ParentEmail, WhatsappNo, Address, CreateDate) 
          VALUES 
          (@RollNo, @PrnNo, @Phase, @Degree, @Semester, @AttendanceId, @FirstName, @MiddleName, @LastName, @Contact, 
           @Email, @Relation, @ParentContactNo, @ParentEmail, @WhatsappNo, @ParentAddress, @CreatedDate)
      `);

      res.status(201).send({ message: "Student created successfully." });
  } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).send({ error: "Internal Server Error" });
  }
});


app.get('/api/getstudents', async (req, res) => {
  try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM Tbl_Student');
      res.json(result.recordset); // Return the records as JSON
  } catch (error) {
      console.error("SQL error", error);
      res.status(500).send("Internal Server Error");
  }
});

app.put('/api/updatestudentstatus/:id', async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body; // This should be a boolean value to update the status

  try {
      const request = pool.request();

      const result = await request
          .input("Id", sql.Int, id)
          .input("Status", sql.Bit, Status) // Assuming Status is a boolean (0 or 1)
          .query(`
              UPDATE Tbl_Student
              SET 
                  Status = @Status
              WHERE ID = @Id
          `);

      if (result.rowsAffected[0] > 0) {
          res.status(200).json({ message: 'Student status updated successfully' });
      } else {
          res.status(404).json({ message: 'Student not found' });
      }
  } catch (error) {
      console.error("Error updating Student status:", error);
      res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/getstudent/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const request = pool.request(); 
      const result = await request
          .input("Id", sql.Int, id) 
          .query('SELECT * FROM Tbl_Student WHERE ID = @Id'); 

      if (result.recordset.length === 0) {
          return res.status(404).send({ message: 'student not found' });
      }

      res.json(result.recordset[0]); // Send the found student as JSON
  } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).send({ message: 'Internal Server Error' });
  }
});


app.put("/api/student/:id", async (req, res) => {
  const {
      rollNo,
      prnNo,
      phase,
      degree,
      semester,
      attendanceId,
      firstName,
      middleName,
      lastName,
      contact,
      email,
      relation,
      contactNo,
      parentEmail,
      whatsappNo,
      address
  } = req.body;
  const studentId = req.params.id;

  try {
      const request = pool.request();
      await request
          .input("StudentId", sql.Int, studentId)
          .input("RollNo", sql.VarChar, rollNo)
          .input("PrnNo", sql.VarChar, prnNo)
          .input("Phase", sql.VarChar, phase)
          .input("Degree", sql.VarChar, degree)
          .input("Semester", sql.VarChar, semester)
          .input("AttendanceId", sql.VarChar, attendanceId)
          .input("FirstName", sql.VarChar, firstName)
          .input("MiddleName", sql.VarChar, middleName)
          .input("LastName", sql.VarChar, lastName)
          .input("Contact", sql.VarChar, contact)
          .input("Email", sql.VarChar, email)
          .input("Relation", sql.VarChar, relation)
          .input("ParentContactNo", sql.VarChar, contactNo)
          .input("ParentEmail", sql.VarChar, parentEmail)
          .input("WhatsappNo", sql.VarChar, whatsappNo)
          .input("ParentAddress", sql.VarChar, address)
          .input("ModifiedDate", sql.DateTime, new Date());

      // Update student details
      const result = await request.query(`
          UPDATE Tbl_Student 
          SET 
              RollNumber = @RollNo,
              PNPNumber = @PrnNo,
              Phase = @Phase,
              Degree = @Degree,
              Semester = @Semester,
              AttendanceID = @AttendanceId,
              FirstName = @FirstName,
              MiddleName = @MiddleName,
              LastName = @LastName,
              Phone = @Contact,
              Email = @Email,
              ParentRelation = @Relation,
              ParentContact = @ParentContactNo,
              ParentEmail = @ParentEmail,
              WhatsappNo = @WhatsappNo,
              Address = @ParentAddress,
              UpdateDate = @ModifiedDate
          WHERE ID = @StudentId
      `);

      if (result.rowsAffected[0] === 0) {
          return res.status(404).send({ message: "Student not found." });
      }

      res.status(200).send({ message: "Student updated successfully." });
  } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).send({ error: "Internal Server Error" });
  }
});


const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
