const config = require('./config.json');
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
const axios = require("axios");
const redis = require('redis');
const { hotelWidget, tabUrl } = require('./widget-hotel');

const client = redis.createClient(config.REDIS_URL, {
    password: config.REDIS_PASSWORD
});

let telegram_url = `https://api.telegram.org/bot${config.TELEGRAM_API}/sendMessage`;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.post("*", (req, res) => {
    const { message } = req.body;

    client.hgetall('telegrambot', (err, info) => {
        let user;
        let initialized;
        let reply;

        if(info && info[message.chat.id]) {
            user = JSON.parse(info[message.chat.id].replace(/\s/g, ''));
        }

        if(user) {
            if(user.initialized) {
                initialized = user.initialized
            }
        } else {
            initialized = false;
        }

        const hotelCityCheck = ['/city', '/checkindate', '/checkoutdate', '/guests', '/rooms'];
        let missingReply = '';

        console.log(message);

        if(!initialized && message.text && message.text.toLowerCase() === '/start') {
            reply = '"Welcome to Clicktripz Travel bot! Please type "/search" to start your search!'
        }

        if(message.text && message.text.toLowerCase() === '/search') {
            client.hset(`telegrambot`, message.chat.id, `{"initialized": true}`);
            reply = 'Which city would you like to go? Use \n\n/city <location> \n/checkInDate <date> \n/checkOutDate <date> \n/guests <number of guests> \n/rooms <number of rooms> \n\nto set searches! \n\nUse "::" to set search at once!'
        }

        if(initialized) {

            let search;

            if(message && message.text) {
                if(message.text.toLowerCase().split('::').length) {
                    search = message.text.toLowerCase().split('::');
                } else {
                    search = [message.text.toLowerCase()];
                }

                console.log(search);

                for(var searchIndex = 0; searchIndex < search.length; searchIndex++) {
                    let cleanSearch = search[searchIndex].trim();
                    let searchSplit = cleanSearch.split(' ');
                    if(hotelCityCheck.indexOf(searchSplit[0]) > -1) {
                        user[searchSplit.shift().replace(/\//g, '').trim()] = searchSplit.join(' ').trim()
                    }
                }

                client.hset('telegrambot', message.chat.id, JSON.stringify(user));

                for(var searchCheckIndex = 0; searchCheckIndex < hotelCityCheck.length; searchCheckIndex++) {
                    if(!user[hotelCityCheck[searchCheckIndex].replace(/\//g, '')]) {
                        missingReply += `Missing ${hotelCityCheck[searchCheckIndex]}! `
                    }

                    if(missingReply !== '' && searchCheckIndex === hotelCityCheck.length - 1) {
                        missingReply += 'Respond back with the command(s) to complete the search!'
                    }
                }

                if(missingReply === '') {
                    reply = 'Please hold as we\'re searching for the best prices!';

                    axios(hotelWidget(user['city'], user['checkindate'], user['checkoutdate'], user['guests'], user['rooms'])).then((res) => {
                        const data = JSON.parse(res.data.replace(/[()]/g, ''));
                        let checkedCampaignsArray = [];
                        let uncheckedCampaignsArray = [];
                        let searchKey = data.searchKey;
                        let checkedCampaigns, uncheckedCampaigns;
                        let city = user['city']
                        let checkInDate = user['checkindate']
                        let checkOutDate = user['checkoutdate']
                        let guests = user['guests']
                        let rooms = user['rooms']

                        while(checkedCampaignsArray.length < 2) {
                            checkedCampaignsArray.push(`&checked_campaigns=${data.form.providers.shift().campaign}`);
                            checkedCampaigns = checkedCampaignsArray.join('');
                        }

                        while(data.form.providers.length) {
                            uncheckedCampaignsArray.push(`&unchecked_campaigns=${data.form.providers.shift().campaign}`);
                            uncheckedCampaigns = uncheckedCampaignsArray.join('');
                        }

                        return tabUrl({checkedCampaigns, uncheckedCampaigns, searchKey, city, checkInDate, checkOutDate, guests, rooms})
                    }).then((taburl) => {
                        sendMessage(telegram_url, message, taburl, res, true).then((response) => {
                            client.hdel('telegrambot', message.chat.id)
                            res.status(200).end();
                            return null;
                        });
                        return null;
                    })
                }
            }
        } else if(!reply) {
            reply = 'Please start with "/search" to start your search!';
        }

        sendMessage(telegram_url, message, reply, res).then((response) => {
            res.status(200).end();
            return null;
        });
    })
});

app.get('*', (req, res) => {
    res.send('hello world!');
})

function sendMessage(url, message, reply, res, parseHtml){
    let resOptions = {'chat_id': message.chat.id, text: reply};

    if(parseHtml) {
        resOptions.parse_mode = 'HTML';
        resOptions.text = `<a href="${reply}">Come check out your deals!</a>`;
    }

    return axios.post(url, resOptions).then(response => {
        return response;
    }).catch(error =>{
        res.status(error.status).end();
    });
}
app.listen(3000);
