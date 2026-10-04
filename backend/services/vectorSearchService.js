const mongoose = require('mongoose'); // needed for ObjectId conversion
const Chunk = require('../models/Chunk');

/**
 * Perform vector search in MongoDB Atlas
 * @param {number[]} embedding - Query embedding vector
 * @param {number} limit - Number of results to return
 * @param {string|null} documentId - Optional ID of a specific PDF to filter by
 * @returns {Promise<Array>} Array of matching chunks with document info
 */
async function vectorSearch(embedding, limit = 5, documentId = null) {
  try {
    const vectorStage = {
      index: 'vector_index', // must match the index name in Atlas
      path: 'embedding',
      queryVector: embedding,
      numCandidates: 100,
      limit: limit,
    };

    // If a specific documentId is provided, filter INSIDE $vectorSearch
    // (requires "documentId" as a filter field in the Atlas vector index)
    if (documentId) {
      vectorStage.filter = { documentId: new mongoose.Types.ObjectId(documentId) };
    }

    const pipeline = [
      { $vectorSearch: vectorStage },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
        },
      },
      { $unwind: '$document' },
      {
        $project: {
          content: 1,
          chunkIndex: 1,
          metadata: 1,
          'document.fileName': 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await Chunk.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    throw new Error('Failed to perform vector search');
  }
}

module.exports = { vectorSearch };