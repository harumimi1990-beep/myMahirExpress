const express = require('express');
const db = require( '../../database' );
const router = express.Router();
const multer = require('multer');
const path = require("path");

function verifyToken(req, res, next) {
  const authHeader = req.headers[ 'authorization' ];
  const token = authHeader && authHeader.split(' ')[ 1 ];

  if ( !token ) return res.status( 401 ).json({
    success: false,
    message: 'Access denied. No token provided.'
  });

  jwt.verify( token, process.env.JWT_SECRET, (err, user) => {
    if ( err ) return res.status( 403 ).json({
      success: false,
      message: 'Invalid token.'
    });
        
    req.user = user;
    next();
  });
}



function successResponse(
    res,
    code = 200,
    message = 'Successful',
    data = null
){
    return res.status(code).json({
        success: true,
        message,
        data
    });
}

function errorResponse(
    res,
    code = 500,
    message = 'Something when wrong',
    error = null,
    errors = null
){
    return res.status(code).json({
        success: false,
        message,
        error,
        errors 
    });
}

//General request for all report
router.get( '/', async (req, res) => {
  try {
    const [ rows ] = await db.query( 'SELECT * FROM reports' );
    successResponse(res, 200, "Reports retrieved successfully.", rows);
  } catch ( err ) {
    errorResponse(res, 500, "Database error. Reports retrieval failed.", err.message);
  }
});

//requst specific id
router.get('/:id',async (req,res) => {
    try{
        const [rows] = await db.query(
            `SELECT report.idreports AS report_id,
                report.title,
                report.date,
                report.category,
                report.image_path,
                report.user_id,
                user.id AS user_id,
                user.name AS user_name,
                user.email AS user_email
            From reports report
            LEFT JOIN users user on report.user_id = user.id
            WHERE report.idreports = ?
            `, [req.params.id]
        );
        if (rows.length < 1) return errorResponse(res,404,"Report not found");
        const row = rows[0];
        const detailReport = {
            id: row.report_id,
            title:row.title,
            date: row.date,
            category: row.category,
            image_path:  row.image_path,
            user:{
                id: row.user_id,
                name: row.user_name,
                email: row.user_email
            }
        };
        successResponse(res, 200, "Successfull", detailReport);
    } catch(err){
        console.error(err);
        errorResponse(res, 500, "Internal Server Error", err.message);
    }
});


// Configure Storage Location & Filename
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "files/images");
  },
  filename: function (req, file, callback) {
    const uniqueName = "image-" + Date.now() + path.extname(file.originalname);
    callback(null, uniqueName);
  },
});

// Initialize Multer
const upload = multer({ storage: storage });
const jwt = require( 'jsonwebtoken' );

// POST - Add Report
router.post("/add", upload.single("image_path"), verifyToken,    async (req, res) => {
  const { title, date, category, user_id } = req.body;
  const image_path = req.file ? `files/images/${req.file.filename}` : null;
  const errors = [];

  //validation
  if (!title || title.trim() === "") {
    errors.push("Title cannot be empty.");
  }

  if (!date || date.trim() === "") {
    errors.push("Date cannot be empty.");
  }

  if (!category || category.trim() === "") {
    errors.push("Category cannot be empty.");
  }

  if (!user_id || user_id.toString().trim() === "") {
    errors.push("User cannot be empty.");
  }

  // Validation Failed
  if (errors.length > 0) {
    return errorResponse(res, 400, "Validation failed.", null, errors);
  }

  try {
    // Insert New Report Into Database
    let query = "INSERT INTO reports (title, date, category, user_id";
    let values = "VALUES (?, ?, ?, ?";
    const params = [title, date, category, user_id];

    // Optional Image
    if (image_path) {
      query += ", image_path";
      values += ", ?";
      params.push(image_path);
    }

    query += ") " + values + ")";

    const [result] = await db.query(query, params);

    const data = {
      id: result.insertId,
    //   title,
    //   date,
    //   category,
    //   image_path: imagePath || null,
    //   user_id,
    };

      // Success Response
    successResponse(res, 201, "Report added successfully.", data);



    // Next Code Here
  } catch (err) {
    errorResponse( res, 500, "Database error. Failed to add report.", err.message );
  }


});

const fs = require("fs");
//delete report
router.delete('/delete/:id', async (req, res) => {
  try {
    // Get Image Path First
    const [rows] = await db.query(
      "SELECT image_path FROM reports WHERE idreports = ?",
      [req.params.id]
    );

    // Error - Not Found
    if (rows.length === 0) {
      return errorResponse(res, 404, "Report not found/does not exist");
    }

    await db.query("DELETE FROM reports WHERE idreports = ?", [req.params.id]);

    // Delete Image From Folder
    const image_path = rows[0].image_path;
    if (image_path) {
        const fullPath = path.join(__dirname, "../..", image_path);
        fs.unlink(fullPath, (err) => {
        if (err) {
            console.warn("Image file not found or already deleted:", fullPath);
        }
        });
    }
    // Next Code Here
  } catch ( err ) {
    errorResponse( res, 500, "Database error. Failed to delete report.", err.message);
  }
    // Success Response
  successResponse(res, 200, "Report deleted successfully.", { id: req.params.id });

});

function validatePayload(title,date,category){
    const errors = []
      // Validation Checks
      if ( !title || title.trim() === '' ) {
        errors.push( 'Title cannot be empty.' );
      }

      if (!date || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        errors.push("Date must be in dd-mm-yyyy format.");
      }

       if (!category || category.trim() === "") {
        errors.push("Category cannot be empty.");
      }
      return errors
}

// PUT - Update Report By ID
router.put("/update/:id", upload.single("image_path"), async (req, res) => {
  const { title, date, category } = req.body;
  const imagePath = req.file ? `/files/images/${req.file.filename}` : null;

  const errors = validatePayload(title,date,category);

  // Validation Failed
  if (errors.length > 0) {
    return errorResponse(res, 400, "Validation failed.", null, errors);
  }

    try {
    // Next Code here
            let query = "UPDATE reports SET title = ?, date = ?, category = ?";
            const params = [title, date, category];

            if (imagePath) {
                query += ", image_path = ?";
                params.push(imagePath);
            }

            query += " WHERE idreports = ?";
            params.push(req.params.id);
            const [result] = await db.query(query, params);

            // Error - Not Found
            if (result.affectedRows === 0) {
                return errorResponse(res, 404, "Report not found");
            }

            // Success Response
            successResponse(res, 200, "Report updated successfully.");

  } catch (err) {
    errorResponse(res, 500, "System error. Please check again.", err.message);
  }



  // Next Code here
});


module.exports = router;