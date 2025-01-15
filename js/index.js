//importing required packages
require('dotenv').config()
const express = require('express')
const path = require("path");
const {GoogleGenerativeAI} = require('@google/generative-ai')

//configure express server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//configure gemini
const genAI = new GoogleGenerativeAI(process.env.API_GEMINI);
const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

/**
 * This class is used to simply store information about cities for which weather can be retrieved.
 */
class City{
    constructor(name, lat, lon){
        this.name = name;
        this.lat = lat;
        this.lon = lon;
    }

    get geo(){
        return{
            lat: this.lat,
            lon: this.lon
        };
    }
}
let cities = [
    new City("Astana", 51.169392, 71.449074),
    new City("Almaty", 43.238949, 76.889709),
    new City("California", 36.778259, -119.417931),
    new City("Paris", 48.864716, 2.349014),
    new City("Province of Turin", 7.367, 45.133)
]

/**
 * This function makes call to OpenWeather api, getting current weather for given latitude and longitude.
 * @param geo - Object with required city's latitude and longitude.
 * @returns {Promise<any>} - Object with weather information.
 */
async function getWeather(geo){
    const api = process.env.API_OPEN_WEATHER;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${api}&units=metric`
    console.log("Fetching:", url);

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(response.statusText);
        }
        return response.json();
    }
    catch(err){
        console.log("Error:", err);
        throw err;
    }
}

/**
 * This function makes call to Gemini api, getting advice on what to do on current weather.
 * @param weatherData - Current weather - includes city name and weather information.
 * @returns {Promise<GenerateContentResult>} - Gemini api answer.
 */
async function getGeminiAnswer(weatherData){
    return await model.generateContent(`
    Briefly tell me what there is to do in ${weatherData.city} city in this weather: 
    weather - ${weatherData.weather}, temperature - ${weatherData.temperature}, feels like - ${weatherData.fltemp}`);
}

/**
 * This function makes call to GNews api, getting latest news for given city.
 * @param city - City for which news is to be received.
 * @returns {Promise<any>} - Object with 'articles' array. Article - dictionary with 'title' and 'description' fields.
 */
async function getGNews(city){
    const api = process.env.API_GNEWS;
    const url = `https://gnews.io/api/v4/search?q=${city}&lang=en&apikey=` + api;

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(response.statusText);
        }
        return response.json();
    }catch(err){
        console.log("Error:", err);
        throw err;
    }
}

/**
 * This function creates a html page based on the received data.
 * For this task it is better to use a templating engine,
 * but within the requirements to assignment - the main logic
 * of page construction should be in a .js file.
 * @param weatherData - Current weather - includes city name and weather information.
 * @param geminiAnswer - Gemini API answer - advice on what to do on current weather.
 * @param news - Object with 'articles' array. Article - dictionary with 'title' and 'description' fields.
 * @returns {string} - html code of page.
 */
function generatePage(weatherData, geminiAnswer, news){
    const page = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>Weather Info</title>
            <!--Importing styles for map-->
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossorigin=""/>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .weather-info {
                    width: 60%;
                }
                .side-panel {
                    width: 35%;
                    padding: 20px;
                }
                button {
                    margin-bottom: 15px;
                    padding: 8px 16px;
                    font-size: 1em;
                    cursor: pointer;
                    border: none;
                    border-radius: 5px;
                    background-color: #007bff;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="weather-info">
                <button onClick="history.back()">Back</button>
                <div>
                    <span>Weather for</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div>
                    <div>
                        <img src="https://openweathermap.org/img/wn/${weatherData.icon}@2x.png" alt="Weather Icon">
                        <div><b>${weatherData.temp}&#8451;</b></div>
                        <div>Feels like: <b>${weatherData.fltemp}&#8451;</b></div>
                    </div>
                    <ul>
                        <li>Weather: <b>${weatherData.weather}</b></li>
                        <li>Description: <b>${weatherData.desc}</b></li>
                        <li>Pressure: <b>${weatherData.pressure}</b> hPa</li>
                        <li>Humidity: <b>${weatherData.humidity}</b>%</li>
                        <li>Wind Speed: <b>${weatherData.wind_speed}</b> m/s</li>
                        <li>Location: <b>${weatherData.city}</b>, <b>${weatherData.country_code}</b></li>
                    </ul>
                    <div id="map" style="height: 350px; width: 450px;"></div>
                </div>
                <div>
                    Coordinates: [<b>${weatherData.coord.lat}</b>, <b>${weatherData.coord.lon}</b>]
                </div>
            </div>
            <div class="side-panel">
                <h2>AI Tip</h2>
                <p>${geminiAnswer.response.text()}</p>
                <h2>${news.articles[0]['title']}</h2>
                <p>${news.articles[0]['description']}</p>
            </div>
            <!--Importing scripts for map-->
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""></script>
            <script>
                const weatherData = ${JSON.stringify(weatherData)};
                //creating map on given coordinates
                const map = L.map('map').setView([weatherData.coord.lat, weatherData.coord.lon], 13);
                //adding OpenStreetMap layer to map
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            </script>
        </body>
    </html>
    `
    return page;
}

/**
 * Index page of website.
 * Returns index.html to response.
 */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html/index.html'));
})

/**
 * POST handler. Gets the city index corresponding to the
 * element of the cities array.
 * Finds weather and other information based on this city.
 */
app.post("/weather", (req, res) => {
    const cityIndex = req.body.city;

    if(!cityIndex || cityIndex >= cities.length){
        return res.send(
            `<h2>Wrong city index: "${cityIndex}"! Please try again.`
        );
    }

    let city = cities[cityIndex];
    getWeather(city.geo)
        .then(async data => {
            const weatherData = {
                city: city.name,
                coord: data.coord,
                weather: data.weather[0].main,
                desc: data.weather[0].description,
                icon: data.weather[0].icon,
                temp: data.main.temp,
                fltemp: data.main.feels_like,
                pressure: data.main.pressure,
                humidity: data.main.humidity,
                wind_speed: data.wind.speed,
                country_code: data.sys.country,
            };

            const geminiAnswer = await getGeminiAnswer(weatherData);
            const news = await getGNews(city.name);
            return res.send(generatePage(weatherData, geminiAnswer, news));
        })
        .catch(err => console.log("Error:", err));
})

app.listen(3000, () =>{
    console.log("Website started on: http://localhost:3000/");
})