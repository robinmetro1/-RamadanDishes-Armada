const express = require("express")
const app = express()
const fs = require('fs');
const path = require("path")
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000;


app.set('views', path.join(__dirname, 'views'));
app.set("view engine","ejs")

const index = require('./routes/index');
app.use('/', index);



  
  // listen on port 3000
  app.listen(port, () => {
    console.log('Express app listening on port 3000');
  });

