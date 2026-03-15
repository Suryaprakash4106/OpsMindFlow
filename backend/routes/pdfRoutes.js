const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const upload = require('../middleware/upload');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Admin only routes
router.post('/upload', isAuthenticated, isAdmin, upload.single('pdf'), pdfController.uploadPDF);
router.delete('/:id', isAuthenticated, isAdmin, pdfController.deletePDF);

// Routes accessible by both admin and employees
router.get('/list', isAuthenticated, pdfController.listPDFs);
router.get('/:id', isAuthenticated, pdfController.getPDF);

module.exports = router;