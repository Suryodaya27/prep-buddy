const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
const questionRouter = require('./routers/questionGeneration.router');

app.use('/api', questionRouter);

app.listen(8080, () => {
  console.log('server started');
});