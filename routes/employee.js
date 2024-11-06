const db = require('../config/db');
const express =  require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyJWT = require('../middleware/authmiddleware'); 

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the directory to save the uploaded files
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname); // Create a unique filename
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

router.get('/employees', verifyJWT , (req, res) =>{
    const sql = `SELECT e.*, c.companyName 
        FROM employeetbl e 
        JOIN companytbl c ON e.employeeCompany = c.companyID`;
    try {
        db.query(sql, (err, results)=>{
            if(err){
                return res.status(201).send([{message: "Cannot fetch employees"}]);
            } else {
                return res.status(200).send(results);
            }
        });
    } catch (error) {
        console.log(error);
    }
});

router.get('/employeeDetails', (req, res)=>{
    const sql = 'SELECT * FROM employeedetailstbl';
    try {
        db.query(sql, (err, results)=>{
            if(err){
                return res.status(201).send([{message: "Cannot fetch employees"}]);
            } else {
                return res.status(200).send(results);
            }
        });
    } catch (error) {
        console.log(error);
    }
});

router.post('/addEmployee', upload.single('employeeProfile'), (req, res) => {
    const employeeName = req.body.employeeName;
    const employeeEmail = req.body.employeeEmail;
    const employeeAddress = req.body.employeeAddress;
    const employeePhone = req.body.employeePhone;
    const employeeAge = +req.body.employeeAge;
    const employeeBirthdate = req.body.employeeBirthdate;
    const employeePosition = req.body.employeePosition;
    const employeeCompany = +req.body.employeeCompany;
    const employeeProfile = req.file.path; 

    
    if (!employeeName || !employeeEmail || !employeeAddress || 
        !employeeAge || !employeeBirthdate || !employeePhone || !employeePosition || !employeeCompany || !employeeProfile) {
        return res.status(400).send([{ message: 'All data should be passed and present' }]);
    }
    // Insert employee into employeetbl
    const sql1 = 'INSERT INTO employeetbl (employeeName, employeeCompany, dateCreated) VALUES (?, ?, NOW())';
    db.query(sql1, [employeeName, employeeCompany], (err, results) => {
        if (err) {
            console.error('Database error:', err); // Log the actual error
            return res.status(500).json([{ message: 'Cannot insert into employeetable' }]);
        }

        if (results.affectedRows > 0) {
            // Insert employee details into employeedetailstbl
            const sql2 = 'INSERT INTO employeedetailstbl (employeeID, employeeEmail, employeeAddress, employeePhoneNumber, employeeAge, employeeBirthdate, employeePosition, employeeProfile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(sql2, [results.insertId, employeeEmail, employeeAddress, employeePhone, employeeAge, employeeBirthdate, employeePosition, employeeProfile], (err, results) => {
                if (err) {
                    console.error('Failed to add employee details:', err); 
                    return res.status(500).json({ message: 'Failed to add employee details' });
                }
                if (results.affectedRows > 0) {
                    return res.status(200).json({ message: 'Success', result: results });
                }
            });
        } else {
            return res.status(500).json([{ message: 'No rows affected in employee table' }]);
        }
    });
});

router.delete('/deleteEmployee', (req, res) => {
    const employeeID = req.body.employeeID;

    // Check if companyID is provided
    if (!employeeID) {
        console.log(req.body);
        return res.status(400).send({ message: 'companyID is required' });
    }

    const sql = "DELETE FROM employeetbl WHERE employeeID = ?;";
    
    db.query(sql, [employeeID], (err, results) => {
        if (err) {
            console.error('Error deleting employee:', err); // Log the error for debugging
            return res.status(500).send({ message: 'Cannot delete employee' });
        }
        
        // Check if any rows were affected
        if (results.affectedRows === 0) {
            return res.status(404).send({ message: 'employee not found' });
        }

        return res.status(200).send({ message: 'employee deleted successfully' });
    });
});

router.post('/detailsEmployee', (req, res)=>{
    const employeeID = req.body.employeeID;
    if(!employeeID){
        return res.status(500).send({message: 'employee id is missing!'});
    } else {
        console.log(employeeID);
    }
    const sql = "SELECT * FROM employeetbl AS e JOIN employeedetailstbl AS ed ON e.employeeID = ed.employeeID WHERE e.employeeID = ?;"
    db.query(sql, [employeeID], (err, results) =>{
        if(err){
            return res.status(201).send({message: err});
        } else{
            return res.status(200).send(results);
        }
    })

})

module.exports = router;