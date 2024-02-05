const express = require("express")
const router = express.Router()
const fs = require('fs');
const axios = require('axios');

const  prayerTimeMap = new Map();

let ingredientToDishesMap = new Map();

const cooktimeService = require('../services/cooktimeService.js');

const ramadhanPrayerAPI = "https://api.aladhan.com/v1/hijriCalendar/1445/9?latitude=21.4225&longitude=39.8262&method=1";
const dishesAPI ="https://file.notion.so/f/f/29f0d547-e67d-414a-aece-c8e4f886f341/7c1daa75-3bea-4684-bf17-be07a0800452/dishes.json?id=bcc24a10-cc7d-4db2-8c82-f61773c06fc7&table=block&spaceId=29f0d547-e67d-414a-aece-c8e4f886f341&expirationTimestamp=1707242400000&signature=0X0Y0dr30wp6ZrOZvfPMsu9rt_iMkEUsx06Q_ChZdcs&downloadName=dishes.json";





router.get('/suggest', (req, res) => {
});

 router.get('/', async (req, res, next) => {
    ingredientToDishesMap = await  cooktimeService.createIngredientToDishesMap();
	return res.render('cooktime.ejs');
});

router.get('/cooktime', (req, res) => {
    const { ingredient, day } = req.query;
    // Validate if both query parameters are provided
    if (!ingredient || !day) {
        return res.status(400).json({ error: 'Both ingredient and day query parameters are required.' });
    }
    let  foundDishes = ingredientToDishesMap.get(ingredient.toLowerCase());
    // Validate if the provided ingredient exists
    if (foundDishes) {

        ({ maghribMinutes, asrMinutes } = cooktimeService.getPrayerTimesofRequestedDay(day));
        cookingTime = cooktimeService.calculateCookingTime(foundDishes, maghribMinutes, asrMinutes);
        //console.log(JSON.stringify(calculateCookingTime(foundDishes,prayerTimeMap,day)));

        res.render('cooktimeResponse', { cookingTime });


    }
    else {
        // If no dishes found, render the cooktime template with noDishesFound set to true
        res.render('cooktime', { noDishesFound: true });
    }

});





module.exports=router