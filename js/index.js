/* by @darthvid@niu.moe, (c) 2017 */

// lib convenience vars
//var grid = document.querySelector('.grid');
var grid = document.getElementById('content');

var layout = new Isotope(grid, {
		itemSelector: '.grid-item',
		layoutMode: 'packery',
		packery: {
			gutter: 5
		}
	});

// "constants" (but may change :P)
var msReload = 6000;
var listBlockTags = ['NSFW', 'EROE', 'EROGE', 'おっぱい'];

// QueryParams
var urlMastoInstance = "";
var isLocalTimeline = true;
var isVisibleNSFW = false;
var percentImgSize = 0.40;
var maxNumImages = 100;
var isDebugMode = false;
var isPolling = true;

//globals
var oldestTootID = null;

window.onload = function() {
	initThisThang();
	addImagesFromToots();
	backfillWall();
	runLoop();
}


function initThisThang() {
	setParamsFromURL();
	console.log("https://" + urlMastoInstance + "/api/v1/timelines/public"
		+ (isLocalTimeline ? "?local=true" : ""));
	setVisibilityNSFW(isVisibleNSFW);
	setLocalTimeline(isLocalTimeline);
	regEventHandlers();
	if (isDebugMode) {
		initDebug();
	}
}

function initDebug() {
	var btnIsPolling = document.createElement("button");
	btnIsPolling.value = "polling";
	btnIsPolling.name = "polling";
	btnIsPolling.id = "btnIsPolling";
	btnIsPolling.onclick = togglePolling;
	document.getElementById("divDebug").appendChild(btnIsPolling);
}

function regEventHandlers() {
	document.getElementById("btnNSFW").addEventListener("click", toggleNSFW);
	document.getElementById("btnLocal").addEventListener("click", toggleLocal);
}

function isNSFW(toot) {
	var boolNSFW = toot.sensitive;
	if (!boolNSFW) {
		toot.tags.forEach(function(tag) {
			if (-1 < listBlockTags.indexOf(tag.name.toUpperCase())) {
				boolNSFW = true;
				console.log("It's " + tag.name.toUpperCase() + "!");
			}
//			console.log(tag.name.toUpperCase());
		});
	}
	return boolNSFW;
}

function toggleNSFW() {
	isVisibleNSFW = !isVisibleNSFW;
	setVisibilityNSFW(isVisibleNSFW);
}
function toggleLocal() {
	isLocalTimeline = !isLocalTimeline;
	setLocalTimeline(isLocalTimeline);
	console.log("local timeline: " + isLocalTimeline);
}
function togglePolling() {
	isPolling = !isPolling;
	setPolling(isPolling);
	console.log("polling: " + isPolling);
}


function setVisibilityNSFW(isVisible) {
	if (isVisible) {
		$(".imgNSFW").css("visibility", "visible");
//		$(".grid-NSFW").css("border", "dashed #990000");
		$("#btnNSFW").html("hide #NSFW");
		$("#btnNSFW").css("color", "red");
	} else {
		$(".imgNSFW").css("visibility", "hidden");
//		$(".grid-NSFW").css("border", "dashed #009999");
		$("#btnNSFW").html('show #nsfw');
		$("#btnNSFW").css("color", "black");
	}
}

function setLocalTimeline(isTimelineLocal) {
	if (isTimelineLocal) {
		$("#btnLocal").html('local timeline');
	} else {
		$("#btnLocal").html("federated timeline");
	}
}

function setPolling(isPoll) {
	if (isPoll) {
		$("#btnPolling").html('polling');
	} else {
		$("#btnPolling").html("stopped");
	}
}

function prependContent(content) {
	var fragment = document.createDocumentFragment();
	fragment.appendChild(content);
	grid.insertBefore(fragment, grid.firstChild);
	layout.prepended(content);
}

function appendContent(content) {
	grid.appendChild(content);
	layout.appended(content);
}


function controlNumImg(){
	var numImagesSofar = grid.childElementCount;
	var numImagesThisRound = 0;
	var numChild = numImagesSofar;
	var heightLine = screen.height * 1.5;
	if (grid.clientHeight > heightLine) {
		var currChild = grid.lastChild;
		var lastChild = currChild;
		var prevChild = currChild.previousSibling;
		while (prevChild && (20 < numChild)) {
			if ((currChild.getBoundingClientRect().top + window.scrollY) > heightLine) {
				var tempChild = lastChild.previousSibling;
				layout.remove(lastChild);
				lastChild = tempChild;
				numImagesThisRound++;
				numChild--;
			}
			currChild = prevChild;
			prevChild = currChild.previousSibling;
		}
		console.log("img -" + numImagesThisRound + " (" + numImagesSofar + ")");
	}
	layout.layout();
}

function backfillWall() {
	if ((1 < oldestTootID) && (grid.clientHeight < screen.height)){
		addImagesFromToots(oldestTootID);
	}
}

function addImagesFromToots(maxTootID) {
	var url = "https://" + urlMastoInstance + "/api/v1/timelines/public?";
	url += (isLocalTimeline ? "&local=true": "");
	url += (maxTootID ? ("&limit=100&max_id=" + maxTootID): "");
	console.log(url);
	$.getJSON(url, function(json){addTootsMedia(json, (maxTootID ? true : false));});
}

function addTootsMedia(json, isAppend = false) {
	var numImagesThisRound = 0;
	var numImagesSofar = grid.childElementCount;
	for (var i = 0; i < json.length; i++) {
		for (var j = 0; j < json[i].media_attachments.length; j++) {
		//<video autoplay loop src='/system/media_attachments/files/000/001/236/original/media.mp4?1492778745'>
			if ("image" == json[i].media_attachments[j].type) {
				var urlPreview = json[i].media_attachments[j].preview_url;
				if (null == document.getElementById(urlPreview)) {
					// NOTE: Had to pass by value to make consistent with onload async.
					//			The image needs to finish loading to get it's dimensions.
					var imgTemp = new Image();
					imgTemp.src = urlPreview;
					addResizedImages(imgTemp, json[i], isAppend);
					//imgTemp.onload = addResizedImages(imgTemp, json[i], isAppend);
					numImagesThisRound++;
				}
			}
		}
	}
	if ((null == oldestTootID) && (0 < json.length)) {
		oldestTootID = json[json.length-1].id;
	}
	if ((0 < json.length) && (oldestTootID > json[json.length-1].id)) {
		oldestTootID = json[json.length-1].id;
	}
	if (isAppend) {
		console.log("img (" + numImagesSofar + ") +" + numImagesThisRound);
	}
	else {
		console.log("img +" + numImagesThisRound + " (" + numImagesSofar + ")");
	}
	
	return numImagesThisRound;
}

function computeScaledImgDimensions(img) {
	var currWidth = Math.floor(img.width * percentImgSize);
	var currHeight = Math.floor(img.height * percentImgSize);
	var maxDimension = Math.min(screen.width, screen.height) - 15;
	var newWidth = currWidth;
	var newHeight = currHeight;
	
	if (newWidth > newHeight) {
		if (newWidth > maxDimension) {
			newWidth = maxDimension;
			newHeight = Math.floor((currHeight * newWidth) / currWidth);
		}
	}
	else {
		if (newHeight > maxDimension) {
			newHeight = maxDimension;
			newWidth = Math.floor((currWidth * newHeight) / currHeight);
		}
	}
	
	if ((0 == newHeight) || (0 == newWidth)) {
		console.log(newWidth + " x " + newHeight);
	}

	return [newWidth, newHeight];
}

function addResizedImages(img, toot, isAppend = false) {
	img.onload = function() {
		var div = document.createElement("div");
		var strTagNSFW = "SFW";
		var link = document.createElement("a");
		link.setAttribute("href", toot.url);
		link.setAttribute("target", "_blank");
		div.id = img.src;

		var [newWidth, newHeight] = computeScaledImgDimensions(img);
//		console.log(newWidth + " x " + newHeight);
		img.width = newWidth;
		
		if (isNSFW(toot)) {
			strTagNSFW = "NSFW";
//	TODO: I want to remove these, but it's the only thing making the border exact (without gutter).
			div.style.width = newWidth + "px";
			div.style.height = newHeight + "px";
			div.textContent = "#nsfw";			
			div.style.lineHeight = div.style.height;
			img.style.position = "absolute";
			img.style.left = 0;
			img.style.top = 0;
			if (!isVisibleNSFW) {
				img.style.visibility = "hidden";
			}
			else {
//				div.style.border = "dashed #990000"
			}
			div.className = "grid-NSFW ";
		}
		
		img.className = "img" + strTagNSFW;
		
		link.appendChild(img);
		div.className = div.className + "grid-item";
		div.appendChild(link);
		if (isAppend) {
			appendContent(div);
		}
		else {
			prependContent(div);
		}
		
		if (toot.reblog) {
			console.log("rb curr: " + div.id);
			toot.media_attachments.forEach(function(oldMedia) {
				console.log("rb old: "+ oldMedia.preview_url);
			});
		}
	}
}


function setParamsFromURL() {
	urlMastoInstance = getParameterByName("instance");
	if (!urlMastoInstance) {
		urlMastoInstance = "mastodon.social";
//		window.location.href = window.location.href + "?instance=mastodon.social";
	}
	console.log("instance: " + urlMastoInstance);
	if ("false" == getParameterByName("local")) {
		isLocalTimeline = false;
	}
	console.log("local timeline: " + isLocalTimeline);
	if ("true" == getParameterByName("nsfwvisible")) {
		isVisibleNSFW = true;
	}
	console.log("show NSFW: " + isVisibleNSFW);
	var paramImgSize = getParameterByName("imgsize");
	if (20 < paramImgSize) {
		percentImgSize = paramImgSize / 100;
	}
	console.log("image size multiplier: " + percentImgSize);
	var paramMaxImg = getParameterByName("maximg");
	if (1 < paramMaxImg) {
		maxNumImages = paramMaxImg;
	}
	console.log("max number of images: " + maxNumImages);
	if ("true" == getParameterByName("debugmode")) {
		isDebugMode = true;
	}
	console.log("debug mode: " + isDebugMode);

	$('#ebInstance').val(urlMastoInstance);
}


// note: Taken from StackOverflow. ^^
function getParameterByName(name, url) {
	if (!url) {
		url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// for controlled development / debugging without getting actual images
function generateRandomContent() {
	var div = document.createElement("div");
	div.className = "grid-item";
	var w = Math.floor((Math.random() * 150) + 45);
	var h = Math.floor((Math.random() * 150) + 45);
	div.style.width = w + "px";
	div.style.height = h + "px";
	
	return div;
}

function runLoop() {
	setInterval(function() {
//		prependContent(generateRandomContent());
		controlNumImg();
		if (isPolling) {
			addImagesFromToots();
			backfillWall();
		}
	}, msReload);
}
