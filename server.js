var express = require('express');
var app = express();

app.use(express.static('dist'));

var listener = app.listen(process.env.PORT, function () {
  console.log('Listening on ' + listener.address().port);
});
