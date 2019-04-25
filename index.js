let telegram_url = `https://api.telegram.org/bot656923293:AAG5yqt_0Ejs7c861zPeAPswi4dbyBu_JTk/sendMessage`;
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
require("dotenv").config();
const axios = require("axios");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.post("*", (req, res) => {
    const { message } = req.body;

    let reply = "Welcome to telegram weather bot";
    let city_check = message.text.toLowerCase().indexOf('/');
    if(message.text.toLowerCase().indexOf("hi") !== -1){
        sendMessage(telegram_url,message,reply,res);
    } else {
        reply = "request not understood, please review and try again.";
        sendMessage(telegram_url, message, reply, res);
    }
});

app.get('*', (req, res) => {
    res.send('hello world!');
})


function sendMessage(url, message, reply, res){
    axios.post(url, {'chat_id': message.chat.id,
        text: reply
    }).then(response => {
        console.log("Message posted");
        res.end("ok");
    }).catch(error =>{
        console.log(error);
    });
}
app.listen();
