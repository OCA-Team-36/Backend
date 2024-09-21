require('dotenv').config();

const express = require('express');
const cors = require("cors");
const router = require('./src/routes/routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
    res.status(200).send({
        status: "succes",
        message: "Halo, Selamat datang",
    });
});

app.listen(port, () =>{
    console.log(`Server listening on port: ${port}`);
})