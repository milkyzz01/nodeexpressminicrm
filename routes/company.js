const express = require('express');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const router = express.Router();
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

router.get('/companies', verifyJWT, (req, res)=>{
    const sql = "SELECT * FROM companytbl;"
    try {
        db.query(sql, (err, results)=>{
            if(err){
                return res.status(201).send([{message: "Bad request"}]);
            } else{
                return res.status(200).send(results);
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send([{message: "Cannot get companies", result: error}]);
    }
});

//check if there is a token
// Example of a protected route
router.get('/check-auth', verifyJWT, (req, res) => {
    // If this route is reached, it means the token was valid
    res.status(200).send({ message: 'Authenticated' });
  });

// Handle the company addition with file upload
router.post('/addcompany', upload.single('companyLogo'), (req, res) => {
    const companyName = req.body.companyName;
    const companyEmail = req.body.companyEmail;
    const companyLogo = req.file.path; // Get the path of the uploaded file
    const companyAddress = req.body.companyAddress;
    const companyPhone = req.body.companyPhone;

    if (!companyName || !companyEmail || !companyLogo || !companyAddress || !companyPhone) {
        return res.status(400).send({ message: 'Missing required fields' });
    }

    try {
        const sql = 'INSERT INTO companytbl (companyName, companyLogo, companyEmail) VALUES (?, ?, ?);';
        db.query(sql, [companyName, companyLogo, companyEmail], (err, results) => {
            if (err) {
                return res.status(500).send({ message: 'Cannot insert data to company table' });
            }
            if (results.affectedRows > 0) {
                const sql2 = "INSERT INTO companydetailstbl (companyID, companyAddress, companyPhone) VALUES (?, ?, ?);";
                db.query(sql2, [results.insertId, companyAddress, companyPhone], (err, results) => {
                    if (err) {
                        return res.status(500).send({ message: 'Cannot insert data to company details table' });
                    }
                    if (results.affectedRows > 0) {
                        return res.status(200).send({ message: 'Success', result: results });
                    }
                });
            }
        });
    } catch (error) {
        return res.status(500).send(error);
    }
});

router.delete('/deleteCompany', (req, res) => {
    const companyID = req.body.companyID;

    // Check if companyID is provided
    if (!companyID) {
        console.log(req.body);
        return res.status(400).send({ message: 'companyID is required' });
    }

    const sql = "DELETE FROM companytbl WHERE companyID = ?;";
    
    db.query(sql, [companyID], (err, results) => {
        if (err) {
            console.error('Error deleting company:', err); // Log the error for debugging
            return res.status(500).send({ message: 'Cannot delete company' });
        }
        
        // Check if any rows were affected
        if (results.affectedRows === 0) {
            return res.status(404).send({ message: 'Company not found' });
        }

        return res.status(200).send({ message: 'Company deleted successfully' });
    });
});

router.post('/companyDetails', (req, res)=>{
    const companyID = req.body.companyID;

    const sql = 'SELECT * FROM companytbl c JOIN companydetailstbl cd ON c.companyID = cd.companyID WHERE c.companyID = ?;';

    if(!companyID){
        return res.status(500).send({message: 'No companyID found?'});
    }
    // if passed the first condition
    db.query(sql, [companyID], (err, results) =>{
        if(err){
            return res.status(201).send({message: 'failed to query'});
        } else{
            return res.status(200).send(results);
        }

    })
    
})


module.exports = router;