const resemble = require('resemblejs/resemble');
const fs = require('fs');
const fetch = require('node-fetch');
const fileType = require('file-type');
const axios = require('axios');
const path = require('path');
const uploads = '/Users/michaelchen/Desktop/resemble-uploads/';


//PROVIDE ABSOLUTE URLs
const artAr = [];
const compareAr = [];



const hydrateImages = (res) => {
	//PRIVATE URL>>>>>>>>> http://privateapi.collectorsystems.com/<sSUBSCRIPTION-ID>/objects?sessionid=<SESSION-ID>&pretty=1
	axios.get('http://api.collectorsystems.com/287/objects?pretty=1')
		.then((response) => { response.data.data.forEach((art, i) => { 
			let droplet = {
				id: art.objectid,
				artist: art.artistname,
				title: art.title,
				medium: art.medium,
				url: `http://api.collectorsystems.com/287/objects/${art.objectid}/mainimage`
			}
			artAr.push(droplet) 

			fetch(droplet.url)
				.then(res => res.buffer())
				.then(buffer => fs.writeFile(`${uploads}art${i}.jpg`, buffer)) 
			})
		})
		.catch(err => err)
}



const compareImages = (res) => {
	artAr.forEach((art, i) => {
		resemble(fs.readFileSync(`${uploads}art${i}.jpg`))				//scaleToSameSize does not work with node-resemble-js; we will 
			.compareTo(fs.readFileSync(`${uploads}peacock.png`))
			.ignoreColors()
			.scaleToSameSize()
			.onComplete((data) => compareAr.push(data))
	})
	findClosestMatch(res)
}


const findClosestMatch = (res) => {
	let matchIndex;
	let closestMatch = compareAr.reduce((a,b, i) => {
		if (a.rawMisMatchPercentage < b.rawMisMatchPercentage) {
			console.log('a more similar, matchIndex: ', matchIndex)
			return a;
		} else { 
			matchIndex = i
			console.log('b more similar, matchIndex: ', matchIndex)
			return b 
		}
	})

	res.sendFile(path.join(`${uploads}art${matchIndex}.jpg`))
}



//=============================ROUTES===============================

module.exports = function(app, db) {

	//post to http://privateapi.collectorsystems.com/login.aspx, UserName=way2b1api, Password=uGsQgoQHzxkx22
	app.post('/login', (req, res) => {
		axios.post('http://privateapi.collectorsystems.com/login.aspx', {
			UserName: 'way2b1api',
			Password: 'uGsQgoQHzxkx22'
		})
	})

	app.get('/hydrate', (req, res) => {
		hydrateImages(res)
		res.send(`I ain't thirsty any more`)
	})

	app.get('/compare', (req, res) => {
		compareImages(res)
	})
};