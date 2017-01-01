var request = require('request');
var cheerio = require('cheerio');
var fs = require('file-system');
var EventEmitter = require('events');
require('events').EventEmitter.defaultMaxListeners = Infinity;

var url = "http://buildingheights.org/?t=worlds-tallest-buildings";
var baseFilePath = '../src/assets/';

request(url, function(error, response, html) {
	console.log(url);
	

	if(!error && response.statusCode == 200) {

		$ = cheerio.load(html);
		buildingList = [];
		buildingObj = {};


		var table = $('table.gradienttable');
		var thead = table.children('thead');
		var tbody = table.children('tbody');

		tableKeys = defineKeys(thead);
		buildingList = loopRows(tableKeys, tbody);		

		// writeFile(baseFilePath + 'json/buildingList.json', buildingList, true);

		downloadImages(buildingList);
		

	}
});

function defineKeys(thead) {

	keysArr = [];
	$(thead.children('tr').children('th')).each(function(i, element) {

		var th = $(this).text().trim();
		keysArr.push(th);

	});

	return keysArr;
};


function loopRows(keys, tbody) {

	rowArr = [];
	$(tbody.children('tr')).each(function(i, element) {
		
		td = $(this).children('td');
		rowDataObj = loopTd(td, keys);		

		rowArr.push(rowDataObj);
	});
	return rowArr;
}


function loopTd(td, keys) {

	rowDataObj = {};
	rowDataArr = [];
	$(td).each(function(i, element) {

		correspondingKey = keys[i];
		data = $(this);
		
		if(correspondingKey.toLowerCase() == "links") {

			rowDataObj[correspondingKey] = getLinks(data);
		
		} 
		else if(correspondingKey.toLowerCase() == "building name") {
			//get text within anchor only to omit *
			rowDataObj[correspondingKey] = getBuildingName(data).trim();
		}
		 else {
			
			rowDataObj[correspondingKey] = data.text().trim();
			
		}
	});
	return rowDataObj;
}


function getLinks(container) {

	var anchorTags = $(container).children('a');
	var linkArr = [];

	$(anchorTags).each(function(i, element) {

		var link = $(this).attr('href');
		linkArr.push(link);

	});

	return linkArr;
}

function getBuildingName(container) {

	var name = $(container).find('a').text();

	return name;
}


function sleepFor( sleepDuration){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}


function writeFile(filePath, fileData, textFile){
	if(textFile == true){

		fileData = JSON.stringify(fileData);
	}

	fs.writeFile(filePath, fileData, function(error){
		 if(error) return console.log('ERROR: ' + error);

		 console.log('download complete');
	})
}



function downloadImages(dataList) {
	var nameKey = "Building Name";

	// for(var i = 0; i < dataList.length; i ++ ){
	for(var i = 69; i < 90; i ++ ){

		links = dataList[i]['Links'];
		buildingName = dataList[i][nameKey];
		targetLink = links[links.length - 1];

		console.log('enter link of: ' + buildingName);
		goToExternalLink(targetLink, buildingName);

		sleepFor(2000);	
	}
}
function goToExternalLink(targetLink, buildingName) {

	request(targetLink, function(error, response, html){

		console.log('DOWNLOADING: ' + buildingName);
		
		var $ = cheerio.load(html);
		var mainImgContainer = $('a.building-image').eq(0);

		// writeImage(baseFilePath + 'img/building_outlines/' + buildingName, $, '#building-image-container', 1);
		writeImage(baseFilePath + 'img/buildings/' + buildingName, $, mainImgContainer, 1);
		

	});
}

function writeImage(filePath, $, container, attempts) {

	var url = $(container).children('img').attr('src');
	console.log(url);

	if(url === undefined) {

		console.log('ERROR FAILED TO DOWNLOAD: ' + filePath);
		writeImage(filePath, $, container, attempts ++ );

		if(attemps > 3 ){
			console.log('failed more than 3 times, not retrying');
		}
	} else {
		request(url).pipe(fs.createWriteStream(filePath + '.png' ));
	}

	

	// request(url)
	// 	.on('error', function(error) {

	// 		// console.log('ERROR FAILED TO DOWNLOAD: ' + error);
	// 		// writeImage(filePath, $, container, attempt ++ );

	// 		// if(attemps > 3 ){
	// 		// 	console.log('failed more than 3 times, not retrying');
	// 		// }
		
	// 	})
	// 	.pipe(fs.createWriteStream(filePath + '.png' ));
};



