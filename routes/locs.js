var express = require('express');
var router = express.Router();
var mysql = require("mysql");




// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodetest"
});


/* GET locations page. */
router.get('/', function(req, res) {
    // var data = req.body;
    // var id = data.id;
	
	
		con.query('SELECT * FROM locations',function(err,result){
		 if(err) throw err;
		
			  console.log( result );
			  res.json(result);
		//   res.send( JSON.stringify(result));
		//  res.send('respond with a resource');
		
		});
	
	
});


module.exports = router;


