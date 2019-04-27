const config = require('./config.json');
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
const { hotelWidget, tabUrl } = require('./widget-hotel');
const axios = require("axios");

let cache = {};
let telegram_url = `https://api.telegram.org/bot${config.TELEGRAM_API}/sendMessage`;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.post("*", (req, res) => {
    const { message } = req.body;
    const initialized = cache[message.chat.id] ? cache[message.chat.id]['initialized'] : false;
    const hotelCityCheck = ['/city', '/checkindate', '/checkoutdate', '/guests', '/rooms'];
    let missingReply = '';

    let reply = "Welcome to Clicktripz Travel bot!";

    console.log(message);

    if(!initialized && message.text && message.text.toLowerCase() === '/start') {
        reply += ' Please type "/search" to start your search!'
    }

    if(message.text && message.text.toLowerCase() === '/search') {
        cache[message.chat.id] = {}
        cache[message.chat.id]['initialized'] = true;
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

                    cache[message.chat.id][searchSplit.shift().replace(/\//g, '').trim()] = searchSplit.join(' ').trim()
                }
            }

            for(var searchCheckIndex = 0; searchCheckIndex < hotelCityCheck.length; searchCheckIndex++) {
                if(!cache[message.chat.id][hotelCityCheck[searchCheckIndex].replace(/\//g, '')]) {
                    missingReply += `Missing ${hotelCityCheck[searchCheckIndex]}! `
                }

                if(missingReply !== '' && searchCheckIndex === hotelCityCheck.length - 1) {
                    missingReply += 'Respond back with the command(s) to complete the search!'
                }
            }

            if(missingReply === '') {
                reply = 'Please hold as we\'re searching for the best prices!';

                axios(hotelWidget(cache[message.chat.id]['city'], cache[message.chat.id]['checkindate'], cache[message.chat.id]['checkoutdate'], cache[message.chat.id]['guests'], cache[message.chat.id]['rooms'])).then((res) => {
                    const data = JSON.parse(res.data.replace(/[()]/g, ''));
                    let checkedCampaignsArray = [];
                    let uncheckedCampaignsArray = [];
                    let searchKey = data.searchKey;
                    let checkedCampaigns, uncheckedCampaigns;
                    let city = cache[message.chat.id]['city']
                    let checkInDate = cache[message.chat.id]['checkindate']
                    let checkOutDate = cache[message.chat.id]['checkoutdate']
                    let guests = cache[message.chat.id]['guests']
                    let rooms = cache[message.chat.id]['rooms']

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
                    sendMessage(telegram_url, message, taburl, res, true);
                    delete cache[message.chat.id];
                    return null;
                })
            }
        }
    }

    if(missingReply) {
        sendMessage(telegram_url, message, missingReply, res);
    } else {
        sendMessage(telegram_url, message, reply, res);
    }

    res.end();

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

    axios.post(url, resOptions).then(response => {
        res.end();
    }).catch(error =>{
        console.log(error);
    });
}
app.listen();
