# WEB Technologies 2 (Back End) assignment 2

This project was developed as part of the "_WEB Technologies 2 (Back End)_" course. 
The objective was to create an application that displays weather information for a specific city using the [OpenWeatherMap API](https://openweathermap.org/api). 
Additionally, the project includes displaying a map of the city 
and integrates two other APIs, namely [Gemini API](https://ai.google.dev/) and [GNews API](https://gnews.io/), to enhance the functionality of the page.

## Installation

1. Clone this repository or download the project archive:
```bash
git clone https://github.com/akgane/web_2
```

2. Unpack the archive or navigate to the project folder.
3. Install the required dependencies:

[express.js](https://www.npmjs.com/package/express)
```bash
npm i express
```

[google/generative-ai](https://www.npmjs.com/package/@google/generative-ai/v/0.8.0)
```bash
npm i @google/generative-ai@0.8.0
```

4. Create a `.env` file in the **js** folder with the following API keys:
```bash
API_OPEN_WEATHER=your-api-key
API_GEMINI=your-api-key
API_GNEWS=your-api-key
```
You can obtain these API keys by signing up for the respective services:

[OpenWeatherMap API](https://openweathermap.org/api) <br>
[Gemini API](https://ai.google.dev/) <br>
[GNews API](https://gnews.io/)


## Usage

1. Run the **index.js** file to start the server:<br>
```bash
node index.js
```
2. Once the server is running, open your browser and visit:<br>
`http://localhost:3000/`