// Library Imports
const cors = require("cors")
const express = require("express")
const http = require("http")
const connection = require('./connection.js')

// Variable declaration
const PORT = 3001;

// initialization
const app = express()
app.use(express.json());
// to enable bodyparser to get request.body from POST/PUT request
app.use(express.urlencoded({ extended: false }));
app.use(cors({}));
 

/**
   *  to start server using http module
   */
 http.createServer(app).listen(PORT, () => {

  console.log("server started", PORT);
  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    
    console.log('connected as id ' + connection.threadId);


    // check server status call api
   app.get('/', (request, response) => {
     response.send("backend server is running")
   })

   app.get('/getentries', (request, response) => {
    connection.query('SELECT label from sort_table', function (error, results, fields) {
      if (error) throw error;
      const result = results.map((value) => value.label)
      // connected!
      response.json({
        data: result
      }) 
    });
   })

   app.post('/updateentries', (request, response) => {
    const query = `UPDATE sort_table s JOIN (${request.body.data.map((value, index) => {
        if(index === 0) {
          return `SELECT ${index+1} as id, '${value}' as newlabel UNION ALL`
        } else if(index !== 0 && index < (request.body.data.length)) {
          return `SELECT ${index+1} as id, '${value}' UNION ALL`
        }else {
          return `SELECT ${index+1} as id, '${value}'`
        }
      })}) vals ON s.id = vals.id SET label = newlabel;` 


    connection.query(query.replace(/UNION ALL,SELECT /g, 'UNION ALL SELECT ' ).replace(/UNION ALL\) vals/g, ') vals'), function (error, results, fields) {
      if (error) throw error;
      connection.query('SELECT label from sort_table', function (error, results, fields) {
        if (error) throw error;
        const result = results.map((value) => value.label)
        // connected!
        response.json({
          data: result
        }) 
      });
    });
  })
  });
});