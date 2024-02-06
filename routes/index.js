const express = require("express")
const router = express.Router()
const fs = require('fs');
const axios = require('axios');


let ingredientToDishesMap = new Map();

const service = require('../services/service.js');


router.get('/suggest', async (req, res) => {
    const { difficulty,day } = req.query;
    const suggestedDish = await service.getSuggestedDish(difficulty,day);
    res.render('suggestResponse',{suggestedDish,difficulty});

});

 router.get('/',  (req, res, next) => {
	return res.render('index.ejs');
});

router.get('/cooktime', async(req, res) => {
    const { ingredient, day } = req.query;
    ingredientToDishesMap = await  service.createIngredientToDishesMap();

    // Validate if both query parameters are provided
    if (!ingredient || !day) {
        return res.status(400).json({ error: 'Both ingredient and day query parameters are required.' });
    }
    let  foundDishes = ingredientToDishesMap.get(ingredient.toLowerCase());
    // Validate if the provided ingredient exists
    if (foundDishes) {

      ({ maghribMinutes, asrMinutes } = await service.getPrayerTimesofRequestedDay(day));

        cookingTime = service.calculateCookingTime(foundDishes, maghribMinutes, asrMinutes);
        //console.log(JSON.stringify(calculateCookingTime(foundDishes,prayerTimeMap,day)));

        res.render('cooktimeResponse', { cookingTime });


    }
    else {
        // If no dishes found, render the cooktime template with noDishesFound set to true
        res.render('index', { noDishesFound: true });
    }

});





module.exports=router