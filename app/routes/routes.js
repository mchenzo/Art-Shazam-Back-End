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



const compareImages = (path, res) => {
	if (compareAr.length === 0) {
		artAr.forEach((art, i) => {
			console.log('when does i become 31????', i)
			resemble(fs.readFileSync(`${uploads}art${i}.jpg`))				//scaleToSameSize does not work with node-resemble-js; we will 
				.compareTo(fs.readFileSync(path))
				.ignoreColors()
				.scaleToSameSize()
				.onComplete((data) => compareAr.push(data))
		})
	}
	findClosestMatch(res)
}


const findClosestMatch = (res) => {
	let matchIndex;
	let closestMatch = compareAr.reduce((a,b, i) => {
		if (a.rawMisMatchPercentage < b.rawMisMatchPercentage) {
			return a;
		} else { 
			matchIndex = i
			return b;
		}
	})
	let response = {
		path: `${uploads}art${matchIndex}.jpg`,
		artist: artAr[matchIndex].artist,
		title: artAr[matchIndex].title,
		medium: artAr[matchIndex].medium,
	}
	res.send(response);
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
		console.log('FRONT END IS THIRSTY!!!!!!!!!')
		hydrateImages(res)
		res.send(`I ain't thirsty any more`)
	})

	app.post('/compare', (req, res) => {
		console.log('FRONT END CALLED FOR A COMPARE!!!!!!!!!', req.body.path)
		compareImages(req.body.path, res)
	})
};