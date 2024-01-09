const router = require('express').Router();
const questionController = require('../controllers/questionGeneration.contoller');


router.post('/generate', async (req, res) => {
    try {
      const { inputParagraph } = req.body;
      if(!inputParagraph) {
        throw new Error('Input paragraph is empty');
      }
      const questions = await questionController.generateQuestion(inputParagraph);
      res.status(200).json({ questions });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  module.exports = router;