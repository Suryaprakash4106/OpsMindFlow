const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const parsePDF = require('../services/pdfParser');
const { generateEmbedding } = require('../services/embeddingService');
const chunkText = require('../utils/chunking');
const fs = require('fs');

// Upload PDF (admin only)
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Parse PDF
    const { text, pages } = await parsePDF(filePath);

    // Save document record
    const doc = new Document({
      fileName,
      filePath,
      fileSize: req.file.size,
      pages,
      uploadedBy: req.session.userId,
      status: 'processing',
    });
    await doc.save();

    // Chunk text
    const chunks = chunkText(text);

    // Generate embeddings and save chunks
    const chunkPromises = chunks.map(async (content, idx) => {
      const embedding = await generateEmbedding(content);
      return {
        documentId: doc._id,
        chunkIndex: idx,
        content,
        embedding,
        metadata: {
          page: Math.floor(idx / 5) + 1, // approximate page (assuming ~5 chunks per page)
          source: fileName,
        },
      };
    });

    const chunkData = await Promise.all(chunkPromises);
    await Chunk.insertMany(chunkData);

    doc.status = 'completed';
    await doc.save();

    res.json({ message: 'PDF uploaded and processed successfully', documentId: doc._id });
  } catch (error) {
    console.error('Upload PDF error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
};

// List all PDFs
exports.listPDFs = async (req, res) => {
  try {
    const docs = await Document.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(docs);
  } catch (error) {
    console.error('List PDFs error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Delete PDF (admin only)
exports.deletePDF = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    fs.unlinkSync(doc.filePath);

    // Delete chunks
    await Chunk.deleteMany({ documentId: doc._id });

    // Delete document record
    await doc.deleteOne();

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
};

// Get single PDF info
exports.getPDF = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};