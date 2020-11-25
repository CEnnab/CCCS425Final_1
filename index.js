let bodyParser = require('body-parser');
let express = require('express');
let cors = require('cors');
let morgan = require('morgan');

let app = express();

app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors());
app.use(morgan('combined'));

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get("/sourcecode", (req, res) => {
    res.send(require('fs').readFileSync(__filename).toString())
});
app.listen(process.env.PORT || 3000)