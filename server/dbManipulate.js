var nedb = require("nedb");
var db = new nedb({filename: "database", autoload: true})

// Upgrade Script
db.update({}, { $set: { hp: 100 } }, { multi: true }, function (err, numReplaced) { 
	// numReplaced = 3 // Field 'system' on Mars, Earth, Jupiter now has value 'solar system'
});

