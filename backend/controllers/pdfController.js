const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const parsePDF = require('../services/pdfParser');
const { generateEmbedding } = require('../services/embeddingService');
const chunkText = require('../utils/chunking');
const fs = require('fs');

// Upload PDF (admin only)
exports.uploadPDF = async (req, res) => {
  let doc;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Parse PDF
    const { text, pages } = await parsePDF(filePath);

    // Save document record
    doc = new Document({
      fileName,
      filePath,
      fileSize: req.file.size,
      pages,
      uploadedBy: req.user._id, // JWT: set by isAuthenticated middleware
      status: 'processing',
    });
    await doc.save();

    // Chunk text
    const chunks = chunkText(text);

    // Generate embeddings in small batches (avoids API rate limits)
    const BATCH_SIZE = 5;
    const chunkData = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (content, j) => {
          const idx = i + j;
          const embedding = await generateEmbedding(content);
          return {
            documentId: doc._id,
            chunkIndex: idx,
            content,
            embedding,
            metadata: {
              page: Math.floor(idx / 5) + 1, // approximate page
              source: fileName,
            },
          };
        })
      );
      chunkData.push(...results);
    }

    await Chunk.insertMany(chunkData);

    doc.status = 'completed';
    await doc.save();

    res.json({ message: 'PDF uploaded and processed successfully', documentId: doc._id });
  } catch (error) {
    console.error('Upload PDF error:', error);
    if (doc) {
      doc.status = 'failed';
      await doc.save().catch(() => {});
    }
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

// Delete PDF
exports.deletePDF = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk if it exists
    try {
      if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Continue with database deletion even if file delete fails
    }

    await Chunk.deleteMany({ documentId: doc._id });
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