const express = require("express")
const router = express.Router()
const fs = require('fs');
const axios = require('axios');


let ingredientToDishesMap = new Map();

const service = require('../services/service.js');

let noDishesFound=false;


router.get('/',  (req, res, next) => {
	return res.render('index.ejs');
});


router.get('/suggest', async (req, res) => {
    const { difficulty,day } = req.query;
    const suggestedDish = await service.getSuggestedDish(difficulty,day);
    res.render('suggestResponse',{suggestedDish,difficulty});

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
        let maghribMinutes ,asrMinutes;

      ({ maghribMinutes, asrMinutes } = await service.getPrayerTimesofRequestedDay(day));

        cookingTime = service.calculateCookingTime(foundDishes, maghribMinutes, asrMinutes);

        
        res.render('cooktimeResponse', { cookingTime ,noDishesFound});


    }
    else {
        res.render('cooktimeResponse', { noDishesFound:true});
    }

});

module.exports=router