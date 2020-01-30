'use strict';

const express = require('express');

const app = express();

let cors = require('cors');
app.use(cors());

app.use(express.static(__dirname));

//app.get('/', (req, res) => {
//	res.render('./index.html');
//});

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;