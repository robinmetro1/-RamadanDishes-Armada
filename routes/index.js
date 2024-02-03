const express = require("express")
const router = express.Router()
const fs = require('fs');
const axios = require('axios');

const dishesMap= new Map();
const  prayerTimeMap = new Map();


const PrayerAPIUrl = "http://api.aladhan.com/v1/calendar/2024?latitude=21.4225&longitude=39.8262&method=1";
const APIUrl ="https://file.notion.so/f/f/29f0d547-e67d-414a-aece-c8e4f886f341/7c1daa75-3bea-4684-bf17-be07a0800452/dishes.json?id=bcc24a10-cc7d-4db2-8c82-f61773c06fc7&table=block&spaceId=29f0d547-e67d-414a-aece-c8e4f886f341&expirationTimestamp=1706968800000&signature=USM3ALkC6E4t1u1ZRDjHiFBIwMqqal-7QiZeUMqBiIs&downloadName=dishes.json";


// Read the JSON file
fs.readFile('./dishes.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading JSON file:', err);
        return;
    }

    try {
        // Parse JSON data
        const jsonData = JSON.parse(data);

        // Convert JSON data to Map and assign it to the global dishesMap variable
        for (const [key, value] of Object.entries(jsonData)) {
            dishesMap.set(key, value);
        }

        // Now you can work with the Map
    } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
    }
});


// Make a GET request using Axios
axios.get(PrayerAPIUrl)
  .then(response => {
    const monthData = response.data.data;
   // console.log(hijriDate);

   let d = 1; //  d are days number in ramadhan 
   prayerTimeMap.clear();

   for (let i = 1; i <= Object.keys(monthData).length; i++) {
       for (const j in monthData[i]) {
           if (monthData[i].hasOwnProperty(j)) {
               const hijri = monthData[i][j].date.hijri;
               if (hijri.month.number==9) {
                   prayerTimeMap.set(d++,
                    {
                        Maghrib: monthData[i][j].timings.Maghrib,
                        Asr: monthData[i][j].timings.Asr
                    } 
                    );} 
           }
       }
   }
   //console.log(prayerTimeMap);

   


    
  });
router.get('/', (req, res, next) => {
	return res.render('cooktime.ejs');
});



router.get('/cooktime', (req, res) => {
    const { ingredient, day } = req.query;
    // Validate if both query parameters are provided
    if (!ingredient || !day) {
        return res.status(400).json({ error: 'Both ingredient and day query parameters are required.' });
    }
    let  foundDishes = [];

    // Validate if the provided ingredient exists
     foundDishes = searchIngredientInDishes(ingredient,dishesMap);
    if (foundDishes.length ==0) {
        return res.status(404).json({ error: 'No dishes found with the provided ingredient.' });
    }
    else{
        console.log(JSON.stringify(calculateCookingTime(foundDishes,prayerTimeMap,day)));
        
        return res.status(200).json(calculateCookingTime(foundDishes,prayerTimeMap,day));

    }

});

// search dishes that conatains the Ingredient
function searchIngredientInDishes(ingredient,dishesMap) {
    let  foundDishes=[];
    for (const [dishId, dish] of dishesMap) {
        if (dish.ingredients.some(ing => ing.toLowerCase() === ingredient.toLowerCase())) {
            foundDishes.push(
                {
                    name : dish.name,
                    ingredients : dish.ingredients,
                    duration : dish.duration
                }
            );
        }
    }
    
    return foundDishes;
}

// Define cooking time calculation function
function calculateCookingTime(foundDishes,prayerTimeMap,day) {
    const response = [];
    foundDishes.forEach((dish, key) => {
        // Convert the time string to minutes
        const maghribMinutes = convertTimeToMinutes(prayerTimeMap.get(parseInt(day)).Maghrib);
        const asrMinutes = convertTimeToMinutes(prayerTimeMap.get(parseInt(day)).Asr);
        cooktime= calculate(dish.duration,maghribMinutes,asrMinutes);
        //console.log("cooktime:"+cooktime);
       // console.log("dish1"+JSON.stringify(dish))
        response.push({
                    name : dish.name,
                    ingredients : dish.ingredients,
                    cooktime : cooktime
            
        })
        
});
return response;
    

} 
//define function to calculate the cooking time relative to Asr prayer
function calculate(duration,maghribMinutes,asrMinutes){
    const cookingTime = asrMinutes -  (maghribMinutes - 15 -duration) ;
    // Calculate if the cooking time is before or after Asr prayer
    const timeRelativeToAsr = cookingTime >= 0 ? `${cookingTime} minutes before Asr` : `${Math.abs(cookingTime)} minutes after Asr`;
    return timeRelativeToAsr;



}

// Helper function to convert time string to minutes
function convertTimeToMinutes(timeString) {
    let [time] = timeString.split(' '); 
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

router.get('/suggest', (req, res) => {
});


module.exports=router